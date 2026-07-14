import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, ListTree, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { paperMarkdownUrl } from "../api/export";
import { getPaper, updatePaper } from "../api/papers";
import { AlertDialog } from "../components/AlertDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { NoticeBanner } from "../components/NoticeBanner";
import { MarkdownEditor, type MarkdownEditorHandle } from "../features/papers/MarkdownEditor";
import { PaperMetadataForm } from "../features/papers/PaperMetadataForm";
import type { PaperMetadata } from "../types/paper";
import { getErrorMessage } from "../utils/errors";

type OutlineItem = {
  id: string;
  level: number;
  text: string;
  occurrenceIndex: number;
};

function cleanHeadingText(value: string): string {
  return value
    .replace(/\s+#+\s*$/, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMarkdownOutline(content: string): OutlineItem[] {
  const occurrences = new Map<string, number>();
  const items: OutlineItem[] = [];
  let inFence = false;

  content.split("\n").forEach((line, lineIndex) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) {
      return;
    }

    const match = /^(#{1,3})\s+(.+)$/.exec(line);
    if (!match) {
      return;
    }

    const text = cleanHeadingText(match[2]);
    if (!text) {
      return;
    }

    const level = match[1].length;
    const key = `${level}:${text.toLowerCase()}`;
    const occurrenceIndex = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrenceIndex + 1);
    items.push({ id: `${lineIndex}-${level}-${occurrenceIndex}`, level, text, occurrenceIndex });
  });

  return items;
}

export function PaperEditorPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [metadata, setMetadata] = useState<PaperMetadata>({});
  const [markdown, setMarkdown] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLeaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [isOutlineOpen, setOutlineOpen] = useState(false);
  const markdownEditorRef = useRef<MarkdownEditorHandle | null>(null);

  const clearNoticeMessage = useCallback(() => setNoticeMessage(null), []);
  const clearErrorMessage = useCallback(() => setErrorMessage(null), []);
  const cancelLeaveConfirm = useCallback(() => setLeaveConfirmOpen(false), []);
  const confirmLeave = useCallback(() => {
    setLeaveConfirmOpen(false);
    navigate("/");
  }, [navigate]);

  const paperQuery = useQuery({
    queryKey: ["paper", paperId],
    queryFn: () => getPaper(paperId!),
    enabled: Boolean(paperId)
  });

  useEffect(() => {
    if (!paperQuery.data) {
      return;
    }
    setTitle(paperQuery.data.title);
    setMetadata(paperQuery.data.metadata);
    setMarkdown(paperQuery.data.markdown_content);
    setVersion(paperQuery.data.version);
    setDirty(false);
  }, [paperQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updatePaper>[1]) => updatePaper(paperId!, payload),
    onSuccess: async (paper) => {
      setMarkdown(paper.markdown_content);
      setVersion(paper.version);
      setDirty(false);
      setNoticeMessage("已保存");
      await queryClient.invalidateQueries({ queryKey: ["paper", paperId] });
      await queryClient.invalidateQueries({ queryKey: ["graph"] });
    },
    onError: (error) => setErrorMessage(getErrorMessage(error, "保存失败"))
  });

  const savePaper = useCallback(() => {
    if (!paperId || saveMutation.isPending || !title.trim()) {
      return;
    }

    const latestMarkdown = markdownEditorRef.current?.getMarkdown() ?? markdown;
    setMarkdown(latestMarkdown);
    saveMutation.mutate({
      title,
      metadata,
      markdown_content: latestMarkdown,
      version
    });
  }, [markdown, metadata, paperId, saveMutation, title, version]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        savePaper();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [savePaper]);

  const markdownStats = useMemo(() => {
    const characters = markdown.replace(/\s/g, "").length;
    const headings = markdown.split("\n").filter((line) => /^#{1,6}\s/.test(line)).length;
    return { characters, headings };
  }, [markdown]);

  const outlineItems = useMemo(() => parseMarkdownOutline(markdown), [markdown]);

  function guardedBack() {
    if (dirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    navigate("/");
  }

  if (paperQuery.isLoading) {
    return <div className="page-state">正在打开文献...</div>;
  }

  if (paperQuery.error || !paperQuery.data) {
    return <div className="page-state error">未找到这篇文献，或加载失败</div>;
  }

  return (
    <div className="editor-page">
      <header className="topbar editor-topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <FileText size={22} />
          </div>
          <div>
            <span className="eyebrow">写作空间</span>
            <h1>文献笔记</h1>
            <p>{title || "未命名文献"}</p>
          </div>
        </div>
        <div className="toolbar">
          <button type="button" onClick={guardedBack}>
            <ArrowLeft size={17} />
            返回工作台
          </button>
          <a className="button-link" href={paperMarkdownUrl(paperQuery.data.id)}>
            <Download size={17} />
            导出本文
          </a>
          <button
            className="primary-action"
            type="button"
            onClick={savePaper}
            disabled={saveMutation.isPending || !title.trim()}
          >
            <Save size={17} />
            {saveMutation.isPending ? "保存中" : "保存"}
          </button>
        </div>
      </header>
      <NoticeBanner message={noticeMessage} onDismiss={clearNoticeMessage} />
      <main className="editor-shell">
        <div className={`editor-workspace${isOutlineOpen ? " outline-open" : ""}`}>
          <aside className="editor-outline" aria-label="文献目录">
            <button
              type="button"
              className="outline-toggle"
              onClick={() => setOutlineOpen((current) => !current)}
              aria-expanded={isOutlineOpen}
              aria-label={isOutlineOpen ? "收起目录" : "展开目录"}
              title={isOutlineOpen ? "收起目录" : "展开目录"}
            >
              {isOutlineOpen ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
            </button>
            <div className="outline-heading">
              <ListTree size={17} />
              <span>目录</span>
            </div>
            {isOutlineOpen ? (
              outlineItems.length > 0 ? (
                <nav className="outline-list" aria-label="文档标题">
                  {outlineItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`outline-item level-${item.level}`}
                      onClick={() => {
                        markdownEditorRef.current?.scrollToHeading(item);
                        setOutlineOpen(false);
                      }}
                    >
                      <span>{item.text}</span>
                    </button>
                  ))}
                </nav>
              ) : (
                <div className="outline-empty">暂无标题</div>
              )
            ) : null}
          </aside>
          <div className="editor-main-column">
            <div className="editor-hero">
              <div>
                <span className={dirty ? "status-chip unsaved" : "status-chip"}>{dirty ? "未保存" : "已同步"}</span>
                <h2>{title || "未命名文献"}</h2>
              </div>
              <div className="paper-metrics">
                <div>
                  <strong>{version}</strong>
                  <span>版本</span>
                </div>
                <div>
                  <strong>{markdownStats.headings}</strong>
                  <span>标题</span>
                </div>
                <div>
                  <strong>{markdownStats.characters}</strong>
                  <span>字符</span>
                </div>
              </div>
            </div>
            <PaperMetadataForm
              title={title}
              metadata={metadata}
              onTitleChange={(value) => {
                setTitle(value);
                setDirty(true);
              }}
              onMetadataChange={(value) => {
                setMetadata(value);
                setDirty(true);
              }}
            />
            <section className="paper-editor-surface" aria-label="笔记编辑器">
              <MarkdownEditor
                ref={markdownEditorRef}
                value={markdown}
                onChange={(value) => {
                  setMarkdown(value);
                  setDirty(true);
                }}
              />
            </section>
            <div className="editor-footer">
              <span>{dirty ? "当前内容尚未保存" : "当前编辑状态已同步"}</span>
              <Link to="/">返回工作台</Link>
            </div>
          </div>
        </div>
      </main>
      <ConfirmDialog
        open={isLeaveConfirmOpen}
        title="确认返回工作台"
        message="当前内容尚未保存，返回后这些修改不会被写入。"
        confirmLabel="返回工作台"
        onCancel={cancelLeaveConfirm}
        onConfirm={confirmLeave}
      />
      <AlertDialog open={Boolean(errorMessage)} title="未能完成操作" message={errorMessage ?? ""} onConfirm={clearErrorMessage} />
    </div>
  );
}
