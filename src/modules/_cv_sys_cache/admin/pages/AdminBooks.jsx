import React, { useState, useEffect, useMemo } from 'react';
import inventoryApi from '../../api/inventoryApi';
import { useSnackbar } from '../../../../context/SnackbarContext';
import BookModal from '../components/BookModal';
import BulkUploadModal from '../components/BulkUploadModal';
import PreviewModal from '../components/PreviewModal';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBooks = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const { showSnackbar } = useSnackbar();

    // Preview state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewType, setPreviewType] = useState('image');
    const [previewTitle, setPreviewTitle] = useState('Preview');

    const openPreview = (url, type, title) => {
        setPreviewUrl(url);
        setPreviewType(type);
        setPreviewTitle(title);
        setPreviewOpen(true);
    };

    const fetchAllBooks = async () => {
        setLoading(true);
        try {
            // Use allSettled so one failing endpoint doesn't kill the other
            const results = await Promise.allSettled([
                inventoryApi.get('admin/ebooks/active'),
                inventoryApi.get('admin/ebooks/inactive')
            ]);

            const activeBooks = results[0].status === 'fulfilled'
                ? (results[0].value.data || []).map(b => ({ ...b, status: 'ACTIVE' }))
                : [];

            // Inactive endpoint returns raw Ebooks entity (different field names)
            // Normalize: coverPhoto → coverPhotoUrl, ebookPdfKey → pdfUrl, active → status
            const inactiveBooks = results[1].status === 'fulfilled'
                ? (results[1].value.data || []).map(b => ({
                    ...b,
                    status: 'INACTIVE',
                    coverPhotoUrl: b.coverPhotoUrl || b.coverPhoto || null,
                    pdfUrl: b.pdfUrl || b.ebookPdfKey || null,
                }))
                : [];

            if (results[0].status === 'rejected') {
                console.error('Failed to fetch active books:', results[0].reason);
            }
            if (results[1].status === 'rejected') {
                console.error('Failed to fetch inactive books:', results[1].reason);
            }

            const allBooks = [...activeBooks, ...inactiveBooks]
                .sort((a, b) => b.bookId - a.bookId);

            setBooks(allBooks);
        } catch (err) {
            console.error("Failed to fetch books", err);
            showSnackbar("Failed to load inventory", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllBooks();
    }, []);

    // Filter books based on selected tab
    const filteredBooks = useMemo(() => {
        if (statusFilter === 'ALL') return books;
        return books.filter(b => b.status === statusFilter);
    }, [books, statusFilter]);

    const activeCount = useMemo(() => books.filter(b => b.status === 'ACTIVE').length, [books]);
    const inactiveCount = useMemo(() => books.filter(b => b.status === 'INACTIVE').length, [books]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredBooks.map(b => b.bookId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedIds.length === 0) return;
        try {
            const endpoint = newStatus === 'ACTIVE' ? 'admin/ebooks/activate' : 'admin/ebooks/deactivate';
            await inventoryApi.put(endpoint, selectedIds);
            showSnackbar(`${selectedIds.length} Books ${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'} Successfully`, "success");
            setSelectedIds([]);
            fetchAllBooks();
        } catch (err) {
            console.error("Bulk status update failed", err);
            showSnackbar("Bulk action failed", "error");
        }
    };

    const toggleStatus = async (bookId, currentStatus) => {
        try {
            const endpoint = currentStatus === 'ACTIVE' ? 'admin/ebooks/deactivate' : 'admin/ebooks/activate';
            await inventoryApi.put(endpoint, [bookId]);
            showSnackbar(`Book ${currentStatus === 'ACTIVE' ? 'Deactivated' : 'Activated'} Successfully`, "success");
            fetchAllBooks();
        } catch (err) {
            console.error("Status toggle failed", err);
            showSnackbar("Failed to update status", "error");
        }
    };

    const handleAddClick = () => {
        setEditingBook(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (book) => {
        setEditingBook(book);
        setIsModalOpen(true);
    };

    const handleSaveBook = async (bookId, data) => {
        try {
            if (bookId) {
                await inventoryApi.put(`admin/ebooks/${bookId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSnackbar("Book updated successfully", "success");
            } else {
                const formData = new FormData();
                Object.keys(data).forEach(key => {
                    if (data[key] !== null && data[key] !== undefined) {
                        formData.append(`books[0].${key}`, data[key]);
                    }
                });

                await inventoryApi.post('admin/ebooks/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSnackbar("Book added successfully", "success");
            }
            fetchAllBooks();
        } catch (err) {
            console.error("Failed to save book", err);
            showSnackbar(err.response?.data?.message || "Failed to save book", "error");
            throw err;
        }
    };

    const handleBulkSave = async (formData) => {
        try {
            await inventoryApi.post('admin/ebooks/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSnackbar("Bulk upload successful", "success");
            fetchAllBooks();
        } catch (err) {
            console.error("Bulk upload failed", err);
            showSnackbar(err.response?.data?.message || "Bulk upload failed", "error");
            throw err;
        }
    };

    if (loading) return <div className="um-loading"><div className="um-spinner"></div><p>Loading Inventory...</p></div>;

    return (
        <div className="admin-books-container">
            <div className="um-header">
                <div className="um-header-content">
                    <div className="um-title-section">
                        <h1 className="um-title">
                            <i className="fas fa-book"></i>
                            Inventory Management
                        </h1>
                        <p className="um-subtitle">Manage your E-Store books</p>
                    </div>
                    <div className="um-actions" style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            className="um-btn-cancel"
                            onClick={() => setIsBulkModalOpen(true)}
                            style={{ background: 'white', color: 'var(--slate-700)' }}
                        >
                            <i className="fas fa-file-upload"></i> Bulk Upload
                        </button>
                        <button 
                            className="um-btn-save"
                            onClick={handleAddClick}
                        >
                            <i className="fas fa-plus"></i> Add New Book
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="um-filter-bar">
                <div className="um-tabs">
                    <button
                        className={`um-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => { setStatusFilter('ALL'); setSelectedIds([]); }}
                    >
                        <i className="fas fa-layer-group"></i>
                        All <span style={{ marginLeft: '4px', opacity: 0.7 }}>({books.length})</span>
                    </button>
                    <button
                        className={`um-tab ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
                        onClick={() => { setStatusFilter('ACTIVE'); setSelectedIds([]); }}
                    >
                        <i className="fas fa-check-circle"></i>
                        Active <span style={{ marginLeft: '4px', opacity: 0.7 }}>({activeCount})</span>
                    </button>
                    <button
                        className={`um-tab ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
                        onClick={() => { setStatusFilter('INACTIVE'); setSelectedIds([]); }}
                    >
                        <i className="fas fa-times-circle"></i>
                        Inactive <span style={{ marginLeft: '4px', opacity: 0.7 }}>({inactiveCount})</span>
                    </button>
                </div>
            </div>

            <div className="um-table-container">
                <table className="um-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll}
                                    checked={selectedIds.length === filteredBooks.length && filteredBooks.length > 0}
                                />
                            </th>
                            <th>Book ID</th>
                            <th>Cover</th>
                            <th>Title & Author</th>
                            <th>Category</th>
                            <th>Language</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBooks.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="um-empty-state">
                                    <i className="fas fa-inbox"></i>
                                    <p>{statusFilter === 'INACTIVE' ? 'No inactive books found' : statusFilter === 'ACTIVE' ? 'No active books found' : 'No books found in inventory'}</p>
                                </td>
                            </tr>
                        ) : (
                            filteredBooks.map((book) => (
                                <tr key={book.bookId} className={`um-table-row ${selectedIds.includes(book.bookId) ? 'selected' : ''}`}>
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(book.bookId)}
                                            onChange={() => handleSelectOne(book.bookId)}
                                        />
                                    </td>
                                    <td className="um-book-id">#{book.bookId}</td>
                                    <td>
                                        <div className="um-book-cover" style={{ position: 'relative', cursor: book.coverPhotoUrl ? 'pointer' : 'default' }}>
                                            {book.coverPhotoUrl ? (
                                                <>
                                                    <img 
                                                        src={book.coverPhotoUrl} 
                                                        alt="cover"
                                                        onClick={() => openPreview(book.coverPhotoUrl, 'image', `${book.bookName} - Cover`)}
                                                    />
                                                    {/* Preview overlay on hover */}
                                                    <div 
                                                        onClick={() => openPreview(book.coverPhotoUrl, 'image', `${book.bookName} - Cover`)}
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: 'rgba(0,0,0,0.4)',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s ease',
                                                            cursor: 'pointer',
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                                    >
                                                        <i className="fas fa-eye" style={{ color: 'white', fontSize: '1rem' }} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="um-cover-placeholder">
                                                    <i className="fas fa-image"></i>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="um-book-details">
                                            <span className="um-book-name">{book.bookName}</span>
                                            <span className="um-book-author">{book.bookAuthor}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="um-role-badge" style={{
                                            background: book.bookCategory === 'EBOOK' ? '#f3e8ff' : '#e0f2fe',
                                            color: book.bookCategory === 'EBOOK' ? '#7c3aed' : '#0369a1',
                                        }}>
                                            <i className={`fas ${book.bookCategory === 'EBOOK' ? 'fa-file-pdf' : 'fa-book'}`} style={{ marginRight: '4px', fontSize: '0.65rem' }} />
                                            {book.bookCategory || 'OTHER'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                                            {book.languageCategory || '—'}
                                        </span>
                                    </td>
                                    <td className="um-book-price">
                                        ₹{book.bookPrice}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>
                                                {book.availableQuantity ?? '—'} <span style={{ color: 'var(--slate-400)', fontWeight: 400 }}>avail</span>
                                            </span>
                                            <span style={{ color: 'var(--slate-500)', fontSize: '0.72rem' }}>
                                                {book.totalQuantity ?? '—'} total · {book.reservedQuantity ?? 0} rsrvd
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`um-status-badge ${book.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                                            <i className={`fas ${book.status === 'ACTIVE' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                            {book.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="um-action-buttons">
                                            {/* Preview Cover */}
                                            {book.coverPhotoUrl && (
                                                <button
                                                    className="um-action-btn"
                                                    style={{ background: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}
                                                    onClick={() => openPreview(book.coverPhotoUrl, 'image', `${book.bookName} - Cover`)}
                                                    title="Preview Cover Image"
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f3e8ff'; e.currentTarget.style.color = '#7c3aed'; }}
                                                >
                                                    <i className="fas fa-image"></i>
                                                </button>
                                            )}
                                            {/* Preview PDF */}
                                            {book.pdfUrl && (
                                                <button
                                                    className="um-action-btn"
                                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                                    onClick={() => openPreview(book.pdfUrl, 'pdf', `${book.bookName} - PDF`)}
                                                    title="Preview PDF"
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                                                >
                                                    <i className="fas fa-file-pdf"></i>
                                                </button>
                                            )}
                                            {/* Toggle Status */}
                                            <button
                                                className={`um-action-btn ${book.status === 'ACTIVE' ? 'deactivate' : 'activate'}`}
                                                onClick={() => toggleStatus(book.bookId, book.status)}
                                                title={book.status === 'ACTIVE' ? "Deactivate Book" : "Activate Book"}
                                            >
                                                <i className={`fas ${book.status === 'ACTIVE' ? 'fa-ban' : 'fa-check'}`}></i>
                                            </button>
                                            {/* Edit */}
                                            <button 
                                                className="um-action-btn edit" 
                                                title="Edit Book" 
                                                onClick={() => handleEditClick(book)}
                                                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="um-bulk-bar"
                    >
                        <div className="um-bulk-content">
                            <span><strong>{selectedIds.length}</strong> books selected</span>
                            <div className="um-bulk-actions">
                                <button onClick={() => handleBulkStatusUpdate('ACTIVE')} className="um-btn-save">
                                    <i className="fas fa-check"></i> Bulk Activate
                                </button>
                                <button onClick={() => handleBulkStatusUpdate('INACTIVE')} className="um-btn-cancel" style={{ background: '#ef4444', color: 'white' }}>
                                    <i className="fas fa-ban"></i> Bulk Deactivate
                                </button>
                                <button onClick={() => setSelectedIds([])} className="um-btn-text">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BookModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveBook}
                book={editingBook}
            />

            <BulkUploadModal 
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSave={handleBulkSave}
            />

            {/* Preview Modal */}
            <PreviewModal 
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                url={previewUrl}
                type={previewType}
                title={previewTitle}
            />
        </div>
    );
};

export default AdminBooks;
