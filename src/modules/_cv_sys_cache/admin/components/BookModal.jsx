import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PreviewModal from './PreviewModal';

const BookModal = ({ isOpen, onClose, onSave, book = null }) => {
    const initialState = {
        bookName: '',
        bookAuthor: '',
        bookDescription: '',
        bookPrice: '',
        totalQuantity: '',
        bookCategory: 'PHYSICAL',
        languageCategory: 'ENGLISH',
        bookPublishDate: new Date().toISOString().split('T')[0]
    };

    const [formData, setFormData] = useState(initialState);
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [ebookPdf, setEbookPdf] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Preview state for existing files
    const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    // Lightbox preview state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewType, setPreviewType] = useState('image');
    const [previewTitle, setPreviewTitle] = useState('');

    useEffect(() => {
        if (book) {
            setFormData({
                bookName: book.bookName || '',
                bookAuthor: book.bookAuthor || '',
                bookDescription: book.bookDescription || '',
                bookPrice: book.bookPrice || '',
                totalQuantity: book.totalQuantity || '',
                bookCategory: book.bookCategory || 'PHYSICAL',
                languageCategory: book.languageCategory || 'ENGLISH',
                bookPublishDate: book.bookPublishDate || new Date().toISOString().split('T')[0]
            });
            setCoverPreviewUrl(book.coverPhotoUrl || null);
            setPdfPreviewUrl(book.pdfUrl || null);
        } else {
            setFormData(initialState);
            setCoverPreviewUrl(null);
            setPdfPreviewUrl(null);
        }
        setCoverPhoto(null);
        setEbookPdf(null);
    }, [book, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === 'coverPhoto') {
            setCoverPhoto(files[0]);
            // Show local preview for the newly selected file
            if (files[0]) {
                setCoverPreviewUrl(URL.createObjectURL(files[0]));
            }
        }
        if (name === 'ebookPdf') {
            setEbookPdf(files[0]);
            // Show local preview for new PDF
            if (files[0]) {
                setPdfPreviewUrl(URL.createObjectURL(files[0]));
            }
        }
    };

    const openPreview = (url, type, title) => {
        setPreviewUrl(url);
        setPreviewType(type);
        setPreviewTitle(title);
        setPreviewOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const data = new FormData();
            
            // For creating, backend expects a list of books (List<CreateEbookRequest>)
            // But for single add/edit, we'll format it based on the action
            if (book) {
                // Edit mode
                Object.keys(formData).forEach(key => data.append(key, formData[key]));
                if (coverPhoto) data.append('coverPhoto', coverPhoto);
                if (ebookPdf) data.append('ebookPdf', ebookPdf);
                await onSave(book.bookId, data);
            } else {
                // Add mode - CreateEbookRequest
                // Note: backend upload takes List<CreateEbookRequest>
                // We'll pass the form data up and let the parent handle the API call structure
                const uploadData = { ...formData, coverPhoto, ebookPdf };
                await onSave(null, uploadData);
            }
            onClose();
        } catch (error) {
            console.error("Form submission error", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="um-modal-overlay">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="um-modal"
                    style={{ maxWidth: '640px', width: '90%' }}
                >
                    <div className="um-modal-header">
                        <h2 className="um-modal-title">
                            {book ? 'Edit Book' : 'Add New Book'}
                        </h2>
                        <button className="um-modal-close" onClick={onClose}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="um-modal-body">
                        <div className="um-form-grid">
                            <div className="um-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="um-label">Book Name</label>
                                <input 
                                    type="text" 
                                    name="bookName"
                                    className="um-input" 
                                    value={formData.bookName}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Author</label>
                                <input 
                                    type="text" 
                                    name="bookAuthor"
                                    className="um-input" 
                                    value={formData.bookAuthor}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Category</label>
                                <select 
                                    name="bookCategory"
                                    className="um-input"
                                    value={formData.bookCategory}
                                    onChange={handleChange}
                                >
                                    <option value="PHYSICAL">Physical Book</option>
                                    <option value="EBOOK">E-Book (PDF)</option>
                                </select>
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Price (₹)</label>
                                <input 
                                    type="number" 
                                    name="bookPrice"
                                    className="um-input" 
                                    value={formData.bookPrice}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Quantity</label>
                                <input 
                                    type="number" 
                                    name="totalQuantity"
                                    className="um-input" 
                                    value={formData.totalQuantity}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Language</label>
                                <select 
                                    name="languageCategory"
                                    className="um-input"
                                    value={formData.languageCategory}
                                    onChange={handleChange}
                                >
                                    <option value="ENGLISH">English</option>
                                    <option value="HINDI">Hindi</option>
                                    <option value="TELUGU">Telugu</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Publish Date</label>
                                <input 
                                    type="date" 
                                    name="bookPublishDate"
                                    className="um-input" 
                                    value={formData.bookPublishDate}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="um-label">Description</label>
                                <textarea 
                                    name="bookDescription"
                                    className="um-input" 
                                    rows="3"
                                    value={formData.bookDescription}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            {/* Cover Photo Section */}
                            <div className="um-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="um-label">Cover Photo {book && '(Optional - upload to replace)'}</label>
                                
                                {/* Existing cover preview */}
                                {coverPreviewUrl && (
                                    <div style={{
                                        marginBottom: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.75rem',
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                    }}>
                                        <img 
                                            src={coverPreviewUrl} 
                                            alt="Cover Preview" 
                                            style={{ 
                                                width: '60px', 
                                                height: '80px', 
                                                objectFit: 'cover', 
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => openPreview(coverPreviewUrl, 'image', `${formData.bookName} - Cover`)}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                                {coverPhoto ? coverPhoto.name : 'Current Cover Photo'}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                {coverPhoto ? `New file selected (${(coverPhoto.size / 1024).toFixed(1)} KB)` : 'Click the image or the preview button to view'}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openPreview(coverPreviewUrl, 'image', `${formData.bookName} - Cover`)}
                                            style={{
                                                width: '34px',
                                                height: '34px',
                                                borderRadius: '8px',
                                                border: '1px solid #e9d5ff',
                                                background: '#f3e8ff',
                                                color: '#7c3aed',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.85rem',
                                                transition: 'all 0.2s ease',
                                                flexShrink: 0,
                                            }}
                                            title="Preview Cover"
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#f3e8ff'; e.currentTarget.style.color = '#7c3aed'; }}
                                        >
                                            <i className="fas fa-eye" />
                                        </button>
                                    </div>
                                )}

                                <input 
                                    type="file" 
                                    name="coverPhoto"
                                    className="um-input" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required={!book && !coverPreviewUrl}
                                />
                            </div>

                            {/* E-Book PDF Section */}
                            {formData.bookCategory === 'EBOOK' && (
                                <div className="um-form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="um-label">E-Book PDF {book && '(Optional - upload to replace)'}</label>

                                    {/* Existing PDF preview */}
                                    {pdfPreviewUrl && (
                                        <div style={{
                                            marginBottom: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.75rem',
                                            background: '#fef2f2',
                                            borderRadius: '10px',
                                            border: '1px solid #fecaca',
                                        }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '8px',
                                                background: '#fee2e2',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <i className="fas fa-file-pdf" style={{ color: '#dc2626', fontSize: '1.3rem' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                                    {ebookPdf ? ebookPdf.name : 'Current E-Book PDF'}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                    {ebookPdf ? `New file selected (${(ebookPdf.size / 1024 / 1024).toFixed(2)} MB)` : 'Click preview to view the PDF'}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openPreview(pdfPreviewUrl, 'pdf', `${formData.bookName} - PDF`)}
                                                style={{
                                                    width: '34px',
                                                    height: '34px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #fecaca',
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s ease',
                                                    flexShrink: 0,
                                                }}
                                                title="Preview PDF"
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                                            >
                                                <i className="fas fa-eye" />
                                            </button>
                                        </div>
                                    )}

                                    <input 
                                        type="file" 
                                        name="ebookPdf"
                                        className="um-input" 
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        required={!book && !pdfPreviewUrl}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="um-modal-footer">
                            <button type="button" className="um-btn-cancel" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="submit" className="um-btn-save" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                                ) : (
                                    book ? 'Update Book' : 'Add Book'
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Lightbox Preview (inside the modal) */}
            <PreviewModal 
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                url={previewUrl}
                type={previewType}
                title={previewTitle}
            />
        </AnimatePresence>
    );
};

export default BookModal;
