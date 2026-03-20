import React, { useState } from 'react';
import { useSnackbar } from '../../../context/SnackbarContext';
import {
    useQuizQuestions,
    useCreateQuizQuestions,
    useUpdateQuizQuestion,
    useDeleteQuizQuestions,
    useExamCategories
} from '../../../hooks/useQuiz';
import { useAcademicsHierarchy } from '../../../hooks/useAcademics';
import API_CONFIG from '../../../config/api.config';
import Skeleton, { SkeletonTable } from '../../../components/ui/Skeleton';
import CustomSelect from '../../../components/ui/CustomSelect';
import '../../../styles/Dashboard.css';
import './QuizManagement.css';

const QuizManagement = () => {
    const { showSnackbar } = useSnackbar();

    // Filter/Search parameters
    const [selectedLevelId, setSelectedLevelId] = useState('');
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
    const [selectedSegmentId, setSelectedSegmentId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [fetchCount, setFetchCount] = useState(50);

    // Data Hooks
    const { data: categories } = useExamCategories();
    const { data: hierarchy, isLoading: hierarchyLoading } = useAcademicsHierarchy();

    // Find category name from selected segment if needed
    const getCategoryName = (levelId, subCatId, segmentId) => {
        if (!hierarchy || !levelId || !subCatId || !segmentId) return '';
        const level = hierarchy.find(l => String(l.id) === String(levelId));
        const subCat = level?.sub_categories?.find(sc => String(sc.id) === String(subCatId));
        const segment = subCat?.segments?.find(s => String(s.id) === String(segmentId));
        return segment?.name || '';
    };

    const getTopicName = (chapterId) => {
        if (!hierarchy || !chapterId) return '';
        for (const level of hierarchy) {
            for (const subCat of (level.sub_categories || [])) {
                for (const segment of (subCat.segments || [])) {
                    const topic = segment.topics?.find(t => String(t.id) === String(chapterId));
                    if (topic) return topic.name;
                }
            }
        }
        return `CH: ${chapterId}`;
    };

    const selectedCategory = getCategoryName(selectedLevelId, selectedSubCategoryId, selectedSegmentId);

    const {
        data: quizData,
        isLoading: isLoadingQuiz,
        error: quizError
    } = useQuizQuestions({
        category: selectedCategory,
        chapterId: selectedTopicId,
        count: fetchCount
    });
    
    // Derived flattened data for modal selections
    const selectedLevel = hierarchy?.find(l => String(l.id) === String(selectedLevelId));
    const selectedSubCategory = selectedLevel?.sub_categories?.find(sc => String(sc.id) === String(selectedSubCategoryId));
    const selectedSegment = selectedSubCategory?.segments?.find(s => String(s.id) === String(selectedSegmentId));

    const quizQuestions = quizData?.content || [];
    const quizTotalElements = quizData?.totalElements || 0;

    // Mutations
    const createMutation = useCreateQuizQuestions();
    const updateMutation = useUpdateQuizQuestion();
    const deleteMutation = useDeleteQuizQuestions();

    // Local State
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkJson, setBulkJson] = useState('');
    const [questionList, setQuestionList] = useState([
        {
            question: '',
            option1: '',
            option2: '',
            option3: '',
            option4: '',
            correctOption: '',
            category: '',
            chapterId: '',
            // UI helper state for hierarchical selection in modal
            _levelId: '',
            _subCategoryId: '',
            _segmentId: ''
        }
    ]);
    const [selectedQuizIds, setSelectedQuizIds] = useState([]);
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    /* ================= HANDLERS ================= */

    const handleQuestionChange = (index, e) => {
        const { name, value } = e.target;
        setQuestionList(prev => {
            const newList = [...prev];
            newList[index] = { ...newList[index], [name]: value };
            return newList;
        });
    };

    const addQuestionField = () => {
        if (isEditingQuestion) return;
        setQuestionList(prev => [
            ...prev,
            {
                question: '', option1: '', option2: '', option3: '', option4: '', correctOption: '',
                category: selectedCategory || '',
                chapterId: selectedTopicId || '',
                _levelId: selectedLevelId || '',
                _subCategoryId: selectedSubCategoryId || '',
                _segmentId: selectedSegmentId || ''
            }
        ]);
        showSnackbar("New question form added", "info");
    };

    const removeQuestionField = (index) => {
        if (questionList.length <= 1) return;
        setQuestionList(prev => prev.filter((_, i) => i !== index));
    };

    const toggleCorrectOption = (index, key) => {
        setQuestionList(prev => {
            const newList = [...prev];
            newList[index] = { ...newList[index], correctOption: key };
            return newList;
        });
    };

    const handleBulkImport = () => {
        try {
            const data = JSON.parse(bulkJson);
            if (!Array.isArray(data)) {
                throw new Error("JSON must be an array of questions");
            }

            const formattedQuestions = data.map((q) => {
                // Determine correctOption letter if it's provided as text matching one of the options
                let correct = q.correctOption || '';
                if (correct.length > 1) {
                    if (correct === q.option1) correct = 'A';
                    else if (correct === q.option2) correct = 'B';
                    else if (correct === q.option3) correct = 'C';
                    else if (correct === q.option4) correct = 'D';
                }

                return {
                    question: q.question || '',
                    option1: q.option1 || '',
                    option2: q.option2 || '',
                    option3: q.option3 || '',
                    option4: q.option4 || '',
                    correctOption: correct,
                    category: q.category || selectedCategory || '',
                    chapterId: q.chapterId || selectedTopicId || '',
                    _levelId: selectedLevelId || '',
                    _subCategoryId: selectedSubCategoryId || '',
                    _segmentId: selectedSegmentId || ''
                };
            });

            setQuestionList(formattedQuestions);
            setShowBulkModal(false);
            setBulkJson('');
            showSnackbar(`Successfully imported ${formattedQuestions.length} questions. Please review them.`, "success");
        } catch (err) {
            showSnackbar("Invalid JSON format: " + err.message, "error");
        }
    };

    const submitQuestion = async () => {
        // Validation
        for (let i = 0; i < questionList.length; i++) {
            const q = questionList[i];
            const missing = [];
            if (!q.question) missing.push("Question text");
            if (!q.option1) missing.push("Option A");
            if (!q.option2) missing.push("Option B");
            if (!q.option3) missing.push("Option C");
            if (!q.option4) missing.push("Option D");
            if (!q.correctOption) missing.push("Correct Answer");

            if (missing.length > 0) {
                return showSnackbar(`Filling ${missing.join(', ')} for question #${i + 1}`, "warning");
            }

            if (!q.category && !q.chapterId) {
                return showSnackbar(`Provide either Category or Chapter for question #${i + 1}`, "warning");
            }
        }

        try {
            // Clean payload: remove UI helpers like _levelId, _subjectId and trim strings
            const cleanedPayload = questionList.map(q => ({
                question: (q.question || '').trim(),
                option1: (q.option1 || '').trim(),
                option2: (q.option2 || '').trim(),
                option3: (q.option3 || '').trim(),
                option4: (q.option4 || '').trim(),
                correctAnswer: (q.correctOption || '').trim().toUpperCase(),
                category: (q.category || '').trim(),
                chapterId: q.chapterId ? Number(q.chapterId) : null
            }));

            if (isEditingQuestion && editingQuestionId) {
                // Edit Mode - backend edit takes single object
                await updateMutation.mutateAsync({ id: editingQuestionId, data: cleanedPayload[0] });
                showSnackbar("Question updated successfully", "success");
            } else {
                // Create Mode (Bulk)
                await createMutation.mutateAsync(cleanedPayload);
                showSnackbar(`Successfully published ${questionList.length} question(s)!`, "success");
            }

            setShowQuestionModal(false);
            setQuestionList([{
                question: '', option1: '', option2: '', option3: '', option4: '', correctOption: '',
                category: selectedCategory || '',
                chapterId: selectedTopicId || ''
            }]);
            setIsEditingQuestion(false);
            setEditingQuestionId(null);

        } catch (err) {
            showSnackbar(err.response?.data?.message || (isEditingQuestion ? "Failed to update question" : "Failed to publish questions"), "error");
        }
    };

    const handleEditQuestion = (q) => {
        setIsEditingQuestion(true);
        setEditingQuestionId(q.id);

        // Try to reverse-engineer Level/Subject from chapterId if possible
        let foundLevelId = '';
        let foundSubCategoryId = '';
        let foundSegmentId = '';
        if (hierarchy && q.chapterId) {
            for (const l of hierarchy) {
                for (const sc of (l.sub_categories || [])) {
                    for (const s of (sc.segments || [])) {
                        if (s.topics?.some(t => String(t.id) === String(q.chapterId))) {
                            foundLevelId = String(l.id);
                            foundSubCategoryId = String(sc.id);
                            foundSegmentId = String(s.id);
                            break;
                        }
                    }
                }
            }
        }

        setQuestionList([{
            question: q.question,
            option1: q.option1 || q.opt1,
            option2: q.option2 || q.opt2,
            option3: q.option3 || q.opt3,
            option4: q.option4 || q.opt4,
            correctOption: q.correctOption || '',
            category: q.category || '',
            chapterId: q.chapterId || '',
            _levelId: foundLevelId,
            _subCategoryId: foundSubCategoryId,
            _segmentId: foundSegmentId
        }]);
        setShowQuestionModal(true);
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        try {
            await deleteMutation.mutateAsync([id]);
            showSnackbar("Question deleted successfully", "success");
        } catch (err) {
            showSnackbar(err.response?.data?.message || "Failed to delete question", "error");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedQuizIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedQuizIds.length} questions?`)) return;

        try {
            await deleteMutation.mutateAsync(selectedQuizIds);
            showSnackbar(`Deleted ${selectedQuizIds.length} questions successfully`, "success");
            setSelectedQuizIds([]);
        } catch (err) {
            showSnackbar(err.response?.data?.message || "Bulk delete process failed", "error");
        }
    };

    const handleToggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedQuizIds(quizQuestions.map(q => q.id));
        } else {
            setSelectedQuizIds([]);
        }
    };

    const handleToggleSelectOne = (id) => {
        setSelectedQuizIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="quiz-management-container section-fade-in">
            <div className="page-header-row">
                <div>
                    <h1>Quiz Manager</h1>
                    <p className="subtitle">Create, edit, and manage question bank.</p>
                </div>
                <div className="admin-header-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => {
                            setIsEditingQuestion(false);
                            setEditingQuestionId(null);
                            setQuestionList([{
                                question: '', option1: '', option2: '', option3: '', option4: '', correctOption: '',
                                category: selectedCategory || '',
                                chapterId: selectedTopicId || '',
                                _levelId: selectedLevelId || '',
                                _subCategoryId: selectedSubCategoryId || '',
                                _segmentId: selectedSegmentId || ''
                            }]);
                            setShowBulkModal(true);
                        }}
                    >
                        <i className="fas fa-file-import"></i> Bulk Import (JSON)
                    </button>
                    <button className="btn-primary" onClick={() => {
                        setIsEditingQuestion(false);
                        setEditingQuestionId(null);
                        setQuestionList([{
                            question: '', option1: '', option2: '', option3: '', option4: '', correctOption: '',
                            category: selectedCategory || '',
                            chapterId: selectedTopicId || '',
                            _levelId: selectedLevelId || '',
                            _subCategoryId: selectedSubCategoryId || '',
                            _segmentId: selectedSegmentId || ''
                        }]);
                        setShowQuestionModal(true);
                    }}>
                        <i className="fas fa-plus"></i> Add New Questions
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="dashboard-section filters-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <CustomSelect
                    label="Level"
                    value={selectedLevelId}
                    onChange={(val) => {
                        setSelectedLevelId(val);
                        setSelectedSubCategoryId('');
                        setSelectedSegmentId('');
                        setSelectedTopicId('');
                    }}
                    options={[
                        { value: '', label: '-- All Levels --' },
                        ...(hierarchy?.map(level => ({ value: level.id, label: level.name })) || [])
                    ]}
                />
                <CustomSelect
                    label="Sub-category"
                    disabled={!selectedLevelId}
                    value={selectedSubCategoryId}
                    onChange={(val) => {
                        setSelectedSubCategoryId(val);
                        setSelectedSegmentId('');
                        setSelectedTopicId('');
                    }}
                    placeholder={selectedLevelId ? '-- All Sections --' : 'Select Level First'}
                    options={[
                        { value: '', label: selectedLevelId ? '-- All Sections --' : 'Select Level First' },
                        ...(hierarchy?.find(l => String(l.id) === String(selectedLevelId))?.sub_categories?.map(sc => ({ value: sc.id, label: sc.name })) || [])
                    ]}
                />
                <CustomSelect
                    label="Subject"
                    disabled={!selectedSubCategoryId}
                    value={selectedSegmentId}
                    onChange={(val) => {
                        setSelectedSegmentId(val);
                        setSelectedTopicId('');
                    }}
                    placeholder={selectedSubCategoryId ? '-- All Subjects --' : 'Select Section First'}
                    options={[
                        { value: '', label: selectedSubCategoryId ? '-- All Subjects --' : 'Select Section First' },
                        ...(hierarchy?.find(l => String(l.id) === String(selectedLevelId))
                            ?.sub_categories?.find(sc => String(sc.id) === String(selectedSubCategoryId))
                            ?.segments?.map(seg => ({ value: seg.id, label: seg.name })) || [])
                    ]}
                />
                <CustomSelect
                    label="Chapter"
                    disabled={!selectedSegmentId}
                    value={selectedTopicId}
                    onChange={(val) => setSelectedTopicId(val)}
                    placeholder={selectedSegmentId ? '-- All Chapters --' : 'Select Subject First'}
                    options={[
                        { value: '', label: selectedSegmentId ? '-- All Chapters --' : 'Select Subject First' },
                        ...(hierarchy?.find(l => String(l.id) === String(selectedLevelId))
                            ?.sub_categories?.find(sc => String(sc.id) === String(selectedSubCategoryId))
                            ?.segments?.find(seg => String(seg.id) === String(selectedSegmentId))
                            ?.topics?.map(topic => ({ value: topic.id, label: topic.name })) || [])
                    ]}
                />
                <CustomSelect
                    label="Show count"
                    value={fetchCount}
                    onChange={(val) => setFetchCount(Number(val))}
                    options={[
                        { value: 10, label: '10 questions' },
                        { value: 20, label: '20 questions' },
                        { value: 50, label: '50 questions' },
                        { value: 100, label: '100 questions' }
                    ]}
                />
            </div>

            {/* Bulk Actions */}
            {selectedQuizIds.length > 0 && (
                <div className="bulk-actions-bar">
                    <span>{selectedQuizIds.length} questions selected</span>
                    <button className="btn-reject" onClick={handleBulkDelete}>Delete Selected</button>
                </div>
            )}

            {/* Questions Table/List */}
            <div className="dashboard-section table-container-modern">
                {isLoadingQuiz || hierarchyLoading ? (
                    <SkeletonTable columns={6} rows={10} />
                ) : !selectedCategory && !selectedTopicId ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <i className="fas fa-filter"></i>
                        </div>
                        <p>Please select a subject or chapter to list questions from the academic hierarchy.</p>
                    </div>
                ) : quizQuestions.length > 0 ? (
                    <div className="table-responsive">
                        <table className="quiz-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            onChange={handleToggleSelectAll}
                                            checked={quizQuestions.length > 0 && selectedQuizIds.length === quizQuestions.length}
                                        />
                                    </th>
                                    <th>ID</th>
                                    <th>Question</th>
                                    <th>Category/Chapter</th>
                                    <th>Correct</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizQuestions.map(q => (
                                    <tr key={q.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedQuizIds.includes(q.id)}
                                                onChange={() => handleToggleSelectOne(q.id)}
                                            />
                                        </td>
                                        <td>#{q.id}</td>
                                        <td>
                                            <div className="q-text" title={q.question}>
                                                {q.question.length > 60 ? q.question.substring(0, 60) + '...' : q.question}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="q-meta">
                                                {q.category && <span className="m-tag">{q.category}</span>}
                                                {q.chapterId && <span className="m-tag gray" title={`ID: ${q.chapterId}`}>{getTopicName(q.chapterId)}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            {q.correctOption ? (
                                                <span className="badge-correct">{q.correctOption}</span>
                                            ) : (
                                                <span className="badge-na" title="Not returned by student-facing endpoint">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon" onClick={() => handleEditQuestion(q)} title="Edit">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteQuestion(q.id)} title="Delete">
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <i className="fas fa-folder-open"></i>
                        </div>
                        <p>No questions found for the selected criteria. Try selecting a different chapter or subject.</p>
                    </div>
                )}

                <div className="table-footer-info">
                    Showing {quizQuestions.length} questions
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showQuestionModal && (
                <div className="modal-overlay-refined">
                    <div className="modal-card large-modal">
                        <div className="modal-header">
                            <h3>{isEditingQuestion ? 'Edit Question' : 'Add New Questions'}</h3>
                            <button className="close-btn" onClick={() => setShowQuestionModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body-scroll">
                            {questionList.map((q, idx) => (
                                <div key={idx} className="question-form-card">
                                    <div className="form-header">
                                        <h4>Question #{idx + 1}</h4>
                                        {!isEditingQuestion && questionList.length > 1 && (
                                            <button className="remove-q-btn" onClick={() => removeQuestionField(idx)}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                    <div className="form-group full">
                                        <textarea
                                            className="form-input"
                                            placeholder="Type question here..."
                                            name="question"
                                            value={q.question}
                                            onChange={(e) => handleQuestionChange(idx, e)}
                                        />
                                    </div>
                                    <div className="options-grid">
                                        <div className="form-group">
                                            <input className="form-input" placeholder="Option A" name="option1" value={q.option1} onChange={e => handleQuestionChange(idx, e)} />
                                            <div
                                                className={`option-tag ${q.correctOption === 'A' ? 'active' : ''}`}
                                                onClick={() => toggleCorrectOption(idx, 'A')}
                                            >A</div>
                                        </div>
                                        <div className="form-group">
                                            <input className="form-input" placeholder="Option B" name="option2" value={q.option2} onChange={e => handleQuestionChange(idx, e)} />
                                            <div
                                                className={`option-tag ${q.correctOption === 'B' ? 'active' : ''}`}
                                                onClick={() => toggleCorrectOption(idx, 'B')}
                                            >B</div>
                                        </div>
                                        <div className="form-group">
                                            <input className="form-input" placeholder="Option C" name="option3" value={q.option3} onChange={e => handleQuestionChange(idx, e)} />
                                            <div
                                                className={`option-tag ${q.correctOption === 'C' ? 'active' : ''}`}
                                                onClick={() => toggleCorrectOption(idx, 'C')}
                                            >C</div>
                                        </div>
                                        <div className="form-group">
                                            <input className="form-input" placeholder="Option D" name="option4" value={q.option4} onChange={e => handleQuestionChange(idx, e)} />
                                            <div
                                                className={`option-tag ${q.correctOption === 'D' ? 'active' : ''}`}
                                                onClick={() => toggleCorrectOption(idx, 'D')}
                                            >D</div>
                                        </div>
                                    </div>
                                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                        <CustomSelect
                                            label="Level"
                                            value={q._levelId}
                                            onChange={val => {
                                                setQuestionList(prev => {
                                                    const newList = [...prev];
                                                    newList[idx] = { ...newList[idx], _levelId: val, _subCategoryId: '', _segmentId: '', chapterId: '', category: '' };
                                                    return newList;
                                                });
                                            }}
                                            options={[
                                                { value: '', label: 'Select Level' },
                                                ...(hierarchy?.map(l => ({ value: l.id, label: l.name })) || [])
                                            ]}
                                        />
                                        <CustomSelect
                                            label="Section"
                                            disabled={!q._levelId}
                                            value={q._subCategoryId}
                                            onChange={val => {
                                                setQuestionList(prev => {
                                                    const newList = [...prev];
                                                    newList[idx] = { ...newList[idx], _subCategoryId: val, _segmentId: '', category: '', chapterId: '' };
                                                    return newList;
                                                });
                                            }}
                                            placeholder="Select Section"
                                            options={[
                                                { value: '', label: 'Select Section' },
                                                ...(hierarchy?.find(l => String(l.id) === String(q._levelId))?.sub_categories?.map(sc => ({ value: sc.id, label: sc.name })) || [])
                                            ]}
                                        />
                                        <CustomSelect
                                            label="Subject"
                                            disabled={!q._subCategoryId}
                                            value={q._segmentId}
                                            onChange={val => {
                                                const seg = hierarchy.find(l => String(l.id) === String(q._levelId))
                                                    ?.sub_categories?.find(sc => String(sc.id) === String(q._subCategoryId))
                                                    ?.segments?.find(s => String(s.id) === String(val));
                                                setQuestionList(prev => {
                                                    const newList = [...prev];
                                                    newList[idx] = {
                                                        ...newList[idx],
                                                        _segmentId: val,
                                                        category: seg?.name || '',
                                                        chapterId: ''
                                                    };
                                                    return newList;
                                                });
                                            }}
                                            placeholder="Select Subject"
                                            options={[
                                                { value: '', label: 'Select Subject' },
                                                ...(hierarchy?.find(l => String(l.id) === String(q._levelId))
                                                    ?.sub_categories?.find(sc => String(sc.id) === String(q._subCategoryId))
                                                    ?.segments?.map(s => ({ value: s.id, label: s.name })) || [])
                                            ]}
                                        />
                                        <CustomSelect
                                            label="Chapter (Topic)"
                                            disabled={!q._segmentId}
                                            value={q.chapterId}
                                            onChange={val => {
                                                setQuestionList(prev => {
                                                    const newList = [...prev];
                                                    newList[idx] = { ...newList[idx], chapterId: val };
                                                    return newList;
                                                });
                                            }}
                                            placeholder="-- Optional Topic --"
                                            options={[
                                                { value: '', label: '-- Optional Topic --' },
                                                ...(hierarchy?.find(l => String(l.id) === String(q._levelId))
                                                    ?.sub_categories?.find(sc => String(sc.id) === String(q._subCategoryId))
                                                    ?.segments?.find(s => String(s.id) === String(q._segmentId))
                                                    ?.topics?.map(t => ({ value: t.id, label: t.name })) || [])
                                            ]}
                                        />
                                    </div>
                                </div>
                            ))}
                            {!isEditingQuestion && (
                                <button className="add-more-btn" onClick={addQuestionField}>
                                    <i className="fas fa-plus"></i> Add Another Question
                                </button>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowQuestionModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={submitQuestion}>
                                {isEditingQuestion ? 'Update Question' : 'Publish All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkModal && (
                <div className="modal-overlay-refined">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Bulk Import Questions (JSON)</h3>
                            <button className="close-btn" onClick={() => setShowBulkModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body">
                            <p className="helper-text">Paste your array of questions in JSON format. Each object should have <code>question</code>, <code>opt1-4</code>, and <code>correctOption</code>.</p>
                            <textarea
                                className="form-input bulk-textarea"
                                placeholder='[{"question": "...", "option1": "...", ...}]'
                                value={bulkJson}
                                onChange={(e) => setBulkJson(e.target.value)}
                                style={{ height: '300px', fontFamily: 'monospace', fontSize: '13px' }}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    handleBulkImport();
                                    setShowQuestionModal(true);
                                }}
                                disabled={!bulkJson.trim()}
                            >
                                Import & Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizManagement;
