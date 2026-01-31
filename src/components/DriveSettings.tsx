'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Folder,
    FolderOpen,
    FolderPlus,
    ChevronRight,
    ChevronDown,
    Loader2,
    Home,
    Check,
    X,
} from 'lucide-react';

interface DriveFolder {
    id: string;
    name: string;
}

interface DriveSettingsProps {
    defaultDocName: string;
    onSettingsChange: (settings: { folderId: string | null; folderPath: string; documentName: string }) => void;
}

export function DriveSettings({ defaultDocName, onSettingsChange }: DriveSettingsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [folders, setFolders] = useState<DriveFolder[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentParentId, setCurrentParentId] = useState<string>('root');
    const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([
        { id: 'root', name: 'My Drive' }
    ]);
    
    // Create folder state
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);
    
    // Selected values
    const [selectedFolder, setSelectedFolder] = useState<{ id: string | null; path: string }>({
        id: null,
        path: 'Auto (PR-Docs-{date})'
    });
    const [documentName, setDocumentName] = useState(defaultDocName);
    const [isCustomName, setIsCustomName] = useState(false);

    // Load saved preferences from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('pr-doc-drive-settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.folderId && parsed.folderPath) {
                    setSelectedFolder({ id: parsed.folderId, path: parsed.folderPath });
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Update default doc name when prop changes
    useEffect(() => {
        if (!isCustomName) {
            setDocumentName(defaultDocName);
        }
    }, [defaultDocName, isCustomName]);

    // Notify parent of settings changes
    useEffect(() => {
        onSettingsChange({
            folderId: selectedFolder.id,
            folderPath: selectedFolder.path,
            documentName: documentName || defaultDocName,
        });
    }, [selectedFolder, documentName, defaultDocName, onSettingsChange]);

    const fetchFolders = useCallback(async (parentId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/drive/folders?parentId=${parentId}`);
            const data = await res.json();
            if (res.ok) {
                setFolders(data.folders);
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleOpenPicker = () => {
        // Reset to root when opening
        setCurrentParentId('root');
        setBreadcrumb([{ id: 'root', name: 'My Drive' }]);
        setShowCreateFolder(false);
        setNewFolderName('');
        setShowFolderPicker(true);
        fetchFolders('root');
    };

    const handleNavigateToFolder = (folderId: string, folderName: string) => {
        setCurrentParentId(folderId);
        setBreadcrumb(prev => [...prev, { id: folderId, name: folderName }]);
        fetchFolders(folderId);
    };

    const handleBreadcrumbClick = (index: number) => {
        const item = breadcrumb[index];
        setCurrentParentId(item.id);
        setBreadcrumb(breadcrumb.slice(0, index + 1));
        fetchFolders(item.id);
    };

    const handleSelectFolder = (folder: DriveFolder | null) => {
        if (folder) {
            const path = [...breadcrumb.map(b => b.name), folder.name].join(' / ');
            setSelectedFolder({ id: folder.id, path });
            // Save to localStorage
            localStorage.setItem('pr-doc-drive-settings', JSON.stringify({
                folderId: folder.id,
                folderPath: path,
            }));
        } else {
            setSelectedFolder({ id: null, path: 'Auto (PR-Docs-{date})' });
            localStorage.removeItem('pr-doc-drive-settings');
        }
        setShowFolderPicker(false);
    };

    const handleSelectCurrentFolder = () => {
        // Select the current folder we're in
        const lastBreadcrumb = breadcrumb[breadcrumb.length - 1];
        const path = breadcrumb.map(b => b.name).join(' / ');
        setSelectedFolder({ id: lastBreadcrumb.id === 'root' ? null : lastBreadcrumb.id, path: lastBreadcrumb.id === 'root' ? 'My Drive (root)' : path });
        if (lastBreadcrumb.id !== 'root') {
            localStorage.setItem('pr-doc-drive-settings', JSON.stringify({
                folderId: lastBreadcrumb.id,
                folderPath: path,
            }));
        }
        setShowFolderPicker(false);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        
        setCreatingFolder(true);
        try {
            const res = await fetch('/api/drive/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFolderName.trim(),
                    parentId: currentParentId,
                }),
            });
            
            if (res.ok) {
                const newFolder = await res.json();
                // Refresh folder list
                fetchFolders(currentParentId);
                // Reset create folder state
                setNewFolderName('');
                setShowCreateFolder(false);
            } else {
                console.error('Failed to create folder');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleNameChange = (value: string) => {
        setDocumentName(value);
        setIsCustomName(value !== defaultDocName);
    };

    const resetToDefault = () => {
        setDocumentName(defaultDocName);
        setIsCustomName(false);
    };

    return (
        <div className="glass-card rounded-xl overflow-hidden">
            {/* Header - Click to expand */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--noir-800)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Folder className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-white">Save Options</p>
                        <p className="text-xs text-[var(--noir-400)]">
                            {selectedFolder.path} • {documentName || defaultDocName}
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[var(--noir-400)]" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--noir-400)]" />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    {/* Folder Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--noir-400)] uppercase tracking-wider">
                            Save Location
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 px-3 py-2 rounded-lg bg-[var(--noir-800)] border border-[var(--noir-700)] text-sm text-white truncate">
                                {selectedFolder.path}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenPicker}
                                className="border-[var(--noir-700)] text-[var(--noir-300)] hover:text-white hover:bg-[var(--noir-700)]"
                            >
                                <FolderOpen className="h-4 w-4 mr-1" />
                                Browse
                            </Button>
                            {selectedFolder.id && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSelectFolder(null)}
                                    className="text-[var(--noir-400)] hover:text-white px-2"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Document Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--noir-400)] uppercase tracking-wider">
                            Document Name
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={documentName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder={defaultDocName}
                                className="flex-1 bg-[var(--noir-800)] border-[var(--noir-700)] text-white placeholder:text-[var(--noir-500)]"
                            />
                            {isCustomName && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetToDefault}
                                    className="text-[var(--noir-400)] hover:text-white px-2"
                                    title="Reset to default"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Folder Picker Modal */}
            {showFolderPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md mx-4 glass-card rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--noir-700)]">
                            <h3 className="text-lg font-semibold text-white">Choose Folder</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowFolderPicker(false)}
                                className="text-[var(--noir-400)] hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1 px-4 py-2 bg-[var(--noir-800)] overflow-x-auto">
                            {breadcrumb.map((item, index) => (
                                <div key={item.id} className="flex items-center">
                                    {index > 0 && <ChevronRight className="h-4 w-4 text-[var(--noir-500)] mx-1" />}
                                    <button
                                        onClick={() => handleBreadcrumbClick(index)}
                                        className={`text-sm px-2 py-1 rounded hover:bg-[var(--noir-700)] transition-colors whitespace-nowrap ${
                                            index === breadcrumb.length - 1 ? 'text-cyan-400' : 'text-[var(--noir-400)]'
                                        }`}
                                    >
                                        {index === 0 ? <Home className="h-4 w-4 inline" /> : item.name}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Create Folder Section */}
                        <div className="px-4 py-2 border-b border-[var(--noir-700)]">
                            {showCreateFolder ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="New folder name"
                                        className="flex-1 bg-[var(--noir-800)] border-[var(--noir-600)] text-white text-sm h-9"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateFolder();
                                            if (e.key === 'Escape') {
                                                setShowCreateFolder(false);
                                                setNewFolderName('');
                                            }
                                        }}
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleCreateFolder}
                                        disabled={!newFolderName.trim() || creatingFolder}
                                        className="btn-primary h-9"
                                    >
                                        {creatingFolder ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setShowCreateFolder(false);
                                            setNewFolderName('');
                                        }}
                                        className="h-9 px-2 text-[var(--noir-400)]"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCreateFolder(true)}
                                    className="w-full justify-start gap-2 text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-700)]"
                                >
                                    <FolderPlus className="h-4 w-4" />
                                    Create New Folder
                                </Button>
                            )}
                        </div>

                        {/* Folder List */}
                        <div className="max-h-64 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                                </div>
                            ) : folders.length === 0 ? (
                                <div className="text-center py-8 text-[var(--noir-400)]">
                                    No folders found
                                </div>
                            ) : (
                                <div className="divide-y divide-[var(--noir-700)]">
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.id}
                                            onClick={() => handleSelectFolder(folder)}
                                            onDoubleClick={() => handleNavigateToFolder(folder.id, folder.name)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--noir-800)] transition-colors text-left group"
                                        >
                                            <Folder className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                            <span className="text-white truncate flex-1">{folder.name}</span>
                                            <ChevronRight className="h-4 w-4 text-[var(--noir-500)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-[var(--noir-700)] bg-[var(--noir-850)]">
                            <Button
                                variant="outline"
                                onClick={() => handleSelectFolder(null)}
                                className="border-[var(--noir-700)] text-[var(--noir-300)]"
                            >
                                Use Auto Folder
                            </Button>
                            <Button
                                onClick={handleSelectCurrentFolder}
                                className="btn-primary"
                            >
                                Select This Folder
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
