/**
 * DocumentVault.jsx — Premium Secure Document Vault Page (Protected)
 * 
 * Supports drag-and-drop/click uploads (PDF, JPG, PNG up to 5MB),
 * real-time list, search filtering, category filtering, downloads,
 * deletion, and storage space calculations.
 */

import { useState, useEffect, useRef } from 'react';
import API from '../config/api';
import toast from 'react-hot-toast';

const DocumentVault = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Fetch document list on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await API.get('/documents/list');
      setDocuments(response.data);
    } catch (error) {
      toast.error('Failed to load documents from vault');
    } finally {
      setLoading(false);
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  // Handle document upload
  const handleUpload = async (file) => {
    if (!file) return;

    // Validate size (5MB limit on server)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds 5MB size limit.');
      return;
    }

    // Validate type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Accepted formats: PDF, JPEG, PNG.');
      return;
    }

    setUploading(true);
    try {
      const base64Data = await fileToBase64(file);
      await API.post('/documents/upload', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64Data,
      });

      toast.success('Document uploaded securely!');
      fetchDocuments();
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error(error.response?.data?.message || 'Secure upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Click file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleUpload(file);
  };

  // Drag and drop events
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleUpload(file);
  };

  // Download document
  const handleDownload = async (docId, fileName) => {
    const downloadToast = toast.loading('Retrieving secure key and downloading...');
    try {
      const response = await API.get(`/documents/${docId}`);
      const { fileData } = response.data;

      // Create download link
      const link = document.createElement('a');
      link.href = fileData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Downloaded successfully!', { id: downloadToast });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Key expired or unauthorized.', { id: downloadToast });
    }
  };

  // Delete document
  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this file permanently? This cannot be undone.')) return;

    try {
      await API.delete(`/documents/${docId}`);
      toast.success('File deleted from vault.');
      fetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file.');
    }
  };

  // Helper size formatter
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Calculate stats
  const totalDocsCount = documents.length;
  const totalSizeBytes = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
  const storageLimitBytes = 500 * 1024 * 1024; // 500MB mock limit
  const storagePercentage = Math.min(100, Math.max(0.5, (totalSizeBytes / storageLimitBytes) * 100));

  // Determine category for files
  const getFileCategory = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('form_16') || lower.includes('form 16') || lower.includes('form16')) return 'Form 16';
    if (lower.includes('26as')) return 'Form 26AS';
    if (lower.includes('ais') || lower.includes('tis')) return 'AIS/TIS';
    return 'Others';
  };

  // Filter lists based on category + search query
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const docCat = getFileCategory(doc.fileName);
    const matchesCategory = activeCategory === 'All' || docCat === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-[#0f0f0f] text-[#e8dfee]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#e8dfee] bg-[#0f0f0f] font-sans relative pb-24">
      {/* Decorative Blur */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7c3aed]/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-12">
        {/* Header Section */}
        <section className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-[#7c3aed] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Document Vault</h1>
            </div>
            <p className="text-sm text-[#ccc3d8]/80 font-medium">Store all your tax documents securely with bank-grade encryption</p>
          </div>

          {/* Storage stats */}
          <div className="glass-card rounded-2xl p-5 flex flex-wrap gap-8 border border-[#4a4455]/20">
            <div>
              <p className="text-xs text-[#ccc3d8]/60 font-bold uppercase">Total Files</p>
              <p className="text-xl font-bold text-[#d2bbff] mt-0.5">{totalDocsCount}</p>
            </div>
            <div className="border-l border-[#4a4455]/20 pl-8">
              <p className="text-xs text-[#ccc3d8]/60 font-bold uppercase">Storage Space</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {formatSize(totalSizeBytes)} <span className="text-xs text-[#ccc3d8]/60 font-medium">/ 500 MB</span>
              </p>
              <div className="w-32 h-1.5 bg-[#221e28] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] rounded-full" style={{ width: `${storagePercentage}%` }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Zone */}
        <section className="mb-10">
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] opacity-10 group-hover:opacity-30 transition duration-300 blur rounded-2xl"></div>
            <div className="relative bg-[#100d16]/30 border-2 border-dashed border-[#4a4455]/40 rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all hover:border-[#7c3aed]">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c3aed] mb-3"></div>
                  <p className="text-[#ccc3d8] text-sm">Uploading document securely...</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-[#7c3aed]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-[#7c3aed]/25">
                    <span className="material-symbols-outlined text-[#d2bbff] text-2xl">cloud_upload</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Drag and drop files here or click to upload</h3>
                  <p className="text-xs text-[#ccc3d8]/60 max-w-md leading-relaxed">Supported formats: PDF, JPEG, PNG. Max file size: 5MB.</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </section>

        {/* Search and Filters */}
        <section className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ccc3d8]/60">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your secure vault..."
                className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-full py-3 pl-12 pr-4 text-[#e8dfee] placeholder:text-[#ccc3d8]/30 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
              />
            </div>
          </div>

          {/* Categories Tab Selector */}
          <div className="flex gap-6 border-b border-[#4a4455]/10 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Form 16', 'Form 26AS', 'AIS/TIS', 'Others'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`pb-4 text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'text-[#d2bbff] border-b-2 border-[#7c3aed]'
                    : 'text-[#ccc3d8]/60 hover:text-[#ccc3d8] border-b-2 border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Document Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc, idx) => {
              const isPdf = doc.fileType === 'application/pdf';
              const fileCategory = getFileCategory(doc.fileName);
              return (
                <div
                  key={doc._id}
                  className="glass-card rounded-2xl p-5 border border-[#4a4455]/20 hover:border-[#7c3aed]/50 transition-all flex flex-col justify-between"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isPdf ? 'bg-red-500/10 text-red-400' : 'bg-[#7c3aed]/10 text-[#d2bbff]'
                    }`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isPdf ? 'picture_as_pdf' : 'image'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="p-1.5 rounded-lg text-[#ccc3d8]/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete permanently"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white mb-1 truncate" title={doc.fileName}>{doc.fileName}</h4>
                    <div className="flex items-center gap-2.5 text-xs text-[#ccc3d8]/60">
                      <span>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4a4455]/40"></span>
                      <span>{formatSize(doc.fileSize)}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => handleDownload(doc._id, doc.fileName)}
                      className="flex-grow py-2 rounded-xl bg-[#221e28] border border-[#4a4455]/30 hover:border-[#7c3aed]/40 text-[#d2bbff] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="md:col-span-3 text-center py-16 bg-[#100d16]/20 border border-[#4a4455]/20 rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-[#ccc3d8]/40 mb-3">folder_open</span>
              <p className="text-sm font-bold text-[#ccc3d8]/60">No files found matching the criteria.</p>
              <p className="text-xs text-[#ccc3d8]/40 mt-1">Upload dynamic forms like Form 16 to populate your secure vault.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DocumentVault;
