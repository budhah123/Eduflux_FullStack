import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { documentApi } from '../services/api/documentApi';
import { getAccessToken } from '../utils/auth';

const defaultThumbnails = {
  physics:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBtXKblxk3qOdK8R27XvBuYP590izZQrYTJvAE87x6w1nep6ReDGjcVdNTCdBsplCCIjKbrMbeNYPvC8vJf9YlUyz7m2bbj9KyEPoMLObHhZ0U36orF-_NjfTEnh1z_JfQBSqGiHEg6QYTJXna0owqoPt_loBzsQnR9nc2u0zSaJiMeOasbcWxE3PyTNR2CznK0DgnEBxNGxfibqWPI2KXd4asAZIKBtQY3MJ1VWIQEg2kTpuWn0OLquITUUcaYtePfRU89wsT75GHT',
  computer:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDq6PrARLljCtATbsHxvy93kXsIBB48nL9cXrzzh6TOXv1eSO5-Yb7ip7VlNjlufptUR0kq3c7WD5SascvuWrKjpQKXU0DZz611xkdfSg-sn03IR9iWYZy7LwAbHq_3S9FrmJad2JdGSOGKbNDVV1_s-e6jdGXTpA74d2c2vOqot1bzkZLyoEQQ3f7M1qJZSI9jUxyotr3T_RfnGoTN4CCqoKgBg0xhxlBkKdWYEYcqzNgV3nbDR9y8vOfMV3WkDFKaHlZfhHfzkMpL',
  business:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDi7u018REexJUUoi7sPCKjVe6qB3xMxvn2-4AQVmZimOuOwrR8t8tHzLrJqvBmm7XdVQ_kR5XlPcEdmg5Z0jIOk8_WyahRRbjvdCwLvXX_48pkjh95w5Udu8JFnFHrbI63oSw0dwbXNPIQ8Qi9lOw7_ZSYdURyKY9ozyeA6PAkSrZuIaXHiQvQ-V5aQkXmgg6uX2XbkOiPwJ4BlqfRsVPWdPOfDoUp5b2jfwcfVqecrKWNNtvYmY2nJIuzbwCgMGJ6MCITdgSaKgJO',
  biology:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDCtY2n8gsyuBQxflZDXZntwL-8obvg_f2cy9z6j5yy7roifSZzuhda9Z8LLnEg_JYZV5xMwogOcDsMhJiEP8e8CeZZWwTC2ZIi-Yx81_NblKUG-kxjYQPj8LlUL0kwqlwUoTldpPr18hValShBot5E_zqsuK6e_gBVPB_LmD_dL2iBQanHkS11PVqburL5YXFOoMLoW5YBHHZxKuHDXDdNNvPvBGki6blFkJFVzi0qINuvewfJzA7_h0jeL7UfOM2-pOlUxaJLZ9tK',
};

export default function BrowsePage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All Subjects');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchPublicDocuments = async () => {
      try {
        setLoading(true);
        const response = await documentApi.getPublicDocuments({
          search,
          subject: subject === 'All Subjects' ? '' : subject,
          category: category === 'All' ? '' : category,
          page,
          limit: 12,
        });

        const items = Array.isArray(response?.data) ? response.data : [];
        setDocuments(items);
        setTotal(
          typeof response?.total === 'number' ? response.total : items.length,
        );
        setTotalPages(
          typeof response?.totalPages === 'number'
            ? response.totalPages
            : Math.max(1, Math.ceil(items.length / 12)),
        );
      } catch (error) {
        console.error('Error fetching public documents:', error);
        setDocuments([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(fetchPublicDocuments, 250);
    return () => window.clearTimeout(timer);
  }, [search, subject, category, page]);

  const filteredDocuments = useMemo(() => {
    return documents.map((doc) => {
      const subjectKey = String(doc.subject || '').toLowerCase();
      let image = defaultThumbnails.physics;
      if (subjectKey.includes('computer') || subjectKey.includes('code'))
        image = defaultThumbnails.computer;
      else if (subjectKey.includes('business') || subjectKey.includes('manage'))
        image = defaultThumbnails.business;
      else if (
        subjectKey.includes('bio') ||
        subjectKey.includes('chem') ||
        subjectKey.includes('medical')
      )
        image = defaultThumbnails.biology;

      return {
        ...doc,
        isLocked: Boolean(doc.isLocked || doc.isPremiumOnly),
        image,
      };
    });
  }, [documents]);

  const handleOpenDocument = (doc) => {
    navigate(`/documents/${doc._id}/view`);
  };

  return (
    <div className="min-h-screen bg-surface-bright text-text-main">
      <Navbar />
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-28 pb-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Browse collection
            </p>
            <h1 className="mt-2 font-display text-4xl text-text-main">
              Public Document Library
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search documents"
              className="min-w-[220px] rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-primary"
            />
            <select
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option>All Subjects</option>
              <option>Computer Science</option>
              <option>Physics</option>
              <option>Biology</option>
              <option>Business Admin</option>
            </select>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option>All</option>
              <option>Lecture Notes</option>
              <option>Past Exams</option>
              <option>Research Papers</option>
              <option>Textbook Solutions</option>
            </select>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between text-sm text-text-muted">
          <span>
            Showing <strong className="text-text-main">{total}</strong> public
            documents
          </span>
          {!getAccessToken() && (
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Sign in to unlock premium files
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[340px] items-center justify-center rounded-2xl border border-outline-variant bg-white text-text-muted">
            Loading public documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex min-h-[340px] items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-white text-center text-text-muted">
            <div>
              <div className="mb-3 text-4xl">search_off</div>
              <p className="font-semibold text-text-main">
                No public documents found
              </p>
              <p className="mt-1 text-sm">Try another subject or keyword.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <article
                key={doc._id}
                className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-40 overflow-hidden bg-surface-container-low">
                  <img
                    src={doc.thumbnailUrl || doc.image}
                    alt={doc.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.target.src = doc.image;
                    }}
                  />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {doc.fileFormat || 'PDF'}
                    </span>
                    {doc.isLocked && (
                      <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      {doc.category || 'Notes'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(doc)}
                      className="mt-2 text-left font-label-md text-label-md font-bold text-text-main hover:text-primary"
                    >
                      {doc.title}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                    <span className="rounded-full bg-surface-container-low px-2 py-1">
                      {doc.subject || 'General'}
                    </span>
                    <span className="rounded-full bg-surface-container-low px-2 py-1">
                      {doc.semester || 'Semester N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>{doc.uploader || 'Eduflux Community'}</span>
                    <span>{doc.downloadCount || 0} downloads</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenDocument(doc)}
                    className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {doc.isLocked ? 'View preview' : 'Open document'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 text-sm text-text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={page >= totalPages}
              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
