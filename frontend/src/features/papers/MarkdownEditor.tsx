import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type VditorType from "vditor";

const VDITOR_CDN = "/vditor";

type EditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export type MarkdownEditorHandle = {
  getMarkdown: () => string;
  scrollToHeading: (target: { level: number; text: string; occurrenceIndex: number }) => void;
};

type VditorConstructor = typeof VditorType;

const toolbar = [
  "headings",
  "bold",
  "italic",
  "strike",
  "|",
  "list",
  "ordered-list",
  "check",
  "|",
  "quote",
  "line",
  "code",
  "inline-code",
  "table",
  "|",
  "undo",
  "redo",
  "|",
  "fullscreen"
];

function safeDestroy(editor: VditorType | null) {
  if (!editor) {
    return;
  }

  const maybeEditor = editor as unknown as {
    destroy?: () => void;
    vditor?: {
      element?: HTMLElement;
    };
  };

  if (!maybeEditor.vditor?.element) {
    return;
  }

  try {
    maybeEditor.destroy?.();
  } catch (error) {
    console.warn("Vditor destroy skipped after partial initialization.", error);
  }
}

function normalizeHeadingText(value: string): string {
  return value.replace(/^H[1-6]\s+/i, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, EditorProps>(function MarkdownEditor({ value, onChange }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<VditorType | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const [initError, setInitError] = useState<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      getMarkdown: () => editorRef.current?.getValue() ?? valueRef.current,
      scrollToHeading: (target) => {
        const container = containerRef.current;
        if (!container) {
          return;
        }

        const headingElements = Array.from(container.querySelectorAll<HTMLElement>(`h${target.level}`));
        const normalizedTarget = normalizeHeadingText(target.text);
        let matchIndex = -1;
        const matchedHeading = headingElements.find((heading) => {
          if (normalizeHeadingText(heading.textContent ?? "") !== normalizedTarget) {
            return false;
          }
          matchIndex += 1;
          return matchIndex === target.occurrenceIndex;
        });

        matchedHeading?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }),
    []
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;

    async function mountEditor() {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      try {
        const module = await import("vditor");
        const Vditor = module.default as VditorConstructor;

        if (cancelled || !containerRef.current) {
          return;
        }

        frame = window.requestAnimationFrame(() => {
          if (cancelled || !containerRef.current) {
            return;
          }

          container.innerHTML = "";

          const initialValue = valueRef.current;
          const editor = new Vditor(container, {
            after: () => {
              window.requestAnimationFrame(() => {
                const mountedEditor = editorRef.current;
                const latestValue = valueRef.current;
                if (mountedEditor && mountedEditor.getValue() !== latestValue) {
                  mountedEditor.setValue(latestValue, true);
                }
              });
            },
            cache: { enable: false },
            cdn: VDITOR_CDN,
            counter: { enable: true, type: "markdown" },
            height: "min(72vh, 760px)",
            icon: "material",
            input: (nextValue) => {
              valueRef.current = nextValue;
              onChangeRef.current(nextValue);
            },
            lang: "zh_CN",
            mode: "wysiwyg",
            placeholder: "在这里做笔记...",
            preview: {
              delay: 300,
              hljs: {
                enable: true,
                lineNumber: false,
                style: "brown-paper"
              },
              markdown: {
                autoSpace: true,
                fixTermTypo: true,
                toc: true
              },
              mode: "editor"
            },
            theme: "classic",
            toolbar,
            toolbarConfig: {
              pin: true
            },
            typewriterMode: true,
            value: initialValue
          });

          editorRef.current = editor;
          if (editor.getValue() !== valueRef.current) {
            editor.setValue(valueRef.current, true);
          }
          setInitError(null);
        });
      } catch (error) {
        if (!cancelled) {
          setInitError(error instanceof Error ? error.message : "Vditor 初始化失败");
        }
      }
    }

    void mountEditor();

    return () => {
      cancelled = true;
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      safeDestroy(editorRef.current);
      editorRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      valueRef.current = value;
      return;
    }
    if (editor.getValue() !== value) {
      editor.setValue(value, true);
    }
    valueRef.current = value;
  }, [value]);

  if (initError) {
    return (
      <textarea
        className="markdown-fallback-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="备用笔记编辑器"
      />
    );
  }

  return <div className="vditor-editor-shell" ref={containerRef} />;
});
