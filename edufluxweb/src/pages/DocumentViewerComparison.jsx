import { useState } from "react";
import DocumentViewer from "./DocumentViewer";
import { useNavigate } from "react-router-dom";

export default function DocumentViewerComparison() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("side-by-side");

  const unlockedDoc = {
    _id: "demo-unlocked",
    title: "Database Management Systems Notes",
    subject: "DBMS",
    semester: "Semester 4",
    fileFormat: "pdf",
    category: "Notes",
    uploader: "Dr. Sarah Jenkins",
    uploaderAvatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA7TNH1CqY7mHSrLlFsFe477pTOhMLTvhp5yFEStihowWKusV968aR5Qy2FmnLHfryHF9gX55EfB-xFDaVHozWAo7GBLKrO1awU3BopGqoA1e9z44ZeQfosBscEIFVaUxyKK6ae4doVVSo6siQpFvKSFGlktOtGfOv_HVZKQ7d9FmaDWmD34rB7Cdg-Pb6i_ASaJaEqi3KpVv_2iEoROQjOtRsDb3dl7QA3RbhNA1KfsiJa2-PCZDpBdw",
    downloadCount: 1200,
    fileSize: 4800000,
    tags: ["Notes", "Semester 4", "Computer Science"],
    createdAt: "2026-06-03T14:42:07.589Z",
    fileUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBtXKblxk3qOdK8R27XvBuYP590izZQrYTJvAE87x6w1nep6ReDGjcVdNTCdBsplCCIjKbrMbeNYPvC8vJf9YlUyz7m2bbj9KyEPoMLObHhZ0U36orF-_NjfTEnh1z_JfQBSqGiHEg6QYTJXna0owqoPt_loBzsQnR9nc2u0zSaJiMeOasbcWxE3PyTNR2CznK0DgnEBxNGxfibqWPI2KXd4asAZIKBtQY3MJ1VWIQEg2kTpuWn0OLquITUUcaYtePfRU89wsT75GHT",
    isLocked: false,
    unlockedVia: "institutional",
  };

  const lockedDoc = {
    _id: "demo-locked",
    title: "Neural Architecture Search in Large Language Models: A Comprehensive Survey",
    subject: "Artificial Intelligence",
    semester: "Graduate",
    fileFormat: "pdf",
    category: "Research Paper",
    uploader: "Dr. Elena Rodriguez",
    uploaderAvatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC8ddiYm73oAe4XEMSraooLoad0QTG-aKe1ifnd-RFyUJFqELcKwAM3qwQyDcgck832u_Mw_47TuZY_Iyi6892EAzUimH2utTMaLQ4xFkiD1Gr-Wq_GmoztfefQXOov5slH6T3ns8wSFIlfRagQSPf9kV8hYq-uyQo1AJhvRAS11pgs-uG_CnrKZZsMnXgVaLhyi8PFXuhf-LgfyqAP6c2b21geulc0l0WAKqarsQZyCgOOLwPLL-fJzw",
    downloadCount: 842,
    fileSize: 3600000,
    tags: ["Research Paper", "AI", "LLM"],
    createdAt: "2026-05-12T02:50:52.123Z",
    fileUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDq6PrARLljCtATbsHxvy93kXsIBB48nL9cXrzzh6TOXv1eSO5-Yb7ip7VlNjlufptUR0kq3c7WD5SascvuWrKjpQKXU0DZz611xkdfSg-sn03IR9iWYZy7LwAbHq_3S9FrmJad2JdGSOGKbNDVV1_s-e6jdGXTpA74d2c2vOqot1bzkZLyoEQQ3f7M1qJZSI9jUxyotr3T_RfnGoTN4CCqoKgBg0xhxlBkKdWYEYcqzNgV3nbDR9y8vOfMV3WkDFKaHlZfhHfzkMpL",
    isLocked: true,
  };

  const demoUploadProgress = {
    approvedUploadCount: 1,
    uploadsUntilNextCredit: 2,
    requiredCount: 3,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-body-md p-6">
      {/* Header Bar */}
      <header className="max-w-[1800px] mx-auto mb-6 bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_stories</span>
              Stitch Design Match: Side-by-Side State Verification
            </h1>
            <p className="text-xs text-slate-400">
              Comparing <b>DocumentViewer - Full Access</b> vs <b>DocumentViewer - Locked Preview</b> generated from Stitch design system tokens.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab("side-by-side")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "side-by-side" ? "bg-primary text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Side-by-Side (Split)
          </button>
          <button
            onClick={() => setActiveTab("unlocked")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "unlocked" ? "bg-primary text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Full Access Only
          </button>
          <button
            onClick={() => setActiveTab("locked")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "locked" ? "bg-primary text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Locked Preview Only
          </button>
        </div>
      </header>

      {/* Main View Container */}
      <div className="max-w-[1800px] mx-auto">
        {activeTab === "side-by-side" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* FULL ACCESS STATE */}
            <div className="bg-surface rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
              <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-6 py-3 text-emerald-300 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">lock_open</span>
                  STATE 1: DocumentViewer - Full Access (isLocked: false)
                </span>
                <span className="bg-emerald-900/90 text-emerald-200 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                  Exact Match: projects/14219527192108377596/screens/2e0cec2d...
                </span>
              </div>
              <div className="max-h-[900px] overflow-y-auto">
                <DocumentViewer
                  documentId="demo-unlocked"
                  forcedState="unlocked"
                  overrideDoc={unlockedDoc}
                  isComparisonMode={true}
                />
              </div>
            </div>

            {/* LOCKED PREVIEW STATE */}
            <div className="bg-surface rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
              <div className="bg-amber-950/80 border-b border-amber-800/80 px-6 py-3 text-amber-300 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  STATE 2: DocumentViewer - Locked Preview (isLocked: true)
                </span>
                <span className="bg-amber-900/90 text-amber-200 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                  Exact Match: projects/14219527192108377596/screens/39ef5feb...
                </span>
              </div>
              <div className="max-h-[900px] overflow-y-auto">
                <DocumentViewer
                  documentId="demo-locked"
                  forcedState="locked"
                  overrideDoc={lockedDoc}
                  overrideUploadProgress={demoUploadProgress}
                  isComparisonMode={true}
                />
              </div>
            </div>
          </div>
        ) : activeTab === "unlocked" ? (
          <div className="bg-surface rounded-2xl border border-slate-700 overflow-hidden shadow-2xl max-w-6xl mx-auto">
            <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-6 py-3 text-emerald-300 text-xs font-bold">
              Full Access State View
            </div>
            <DocumentViewer
              documentId="demo-unlocked"
              forcedState="unlocked"
              overrideDoc={unlockedDoc}
              isComparisonMode={true}
            />
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-slate-700 overflow-hidden shadow-2xl max-w-6xl mx-auto">
            <div className="bg-amber-950/80 border-b border-amber-800/80 px-6 py-3 text-amber-300 text-xs font-bold">
              Locked Preview State View
            </div>
            <DocumentViewer
              documentId="demo-locked"
              forcedState="locked"
              overrideDoc={lockedDoc}
              overrideUploadProgress={demoUploadProgress}
              isComparisonMode={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
