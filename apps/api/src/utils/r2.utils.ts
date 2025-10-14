export function sanitizePathSegment(s?: string) {
    if (!s) return '';
    return s.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
}

// Get modality from MIME type (image, audio, video, text)
export function modalityFromType(t: string): string {
    if (t.startsWith('image/')) return 'image';
    if (t.startsWith('video/')) return 'video';
    if (t.startsWith('audio/')) return 'audio';
    if (t === 'application/pdf' || t === 'text/plain') return 'text';
    return 'unknown';
}

// Get file extension from MIME type
export function extFromType(t: string): string {
    if (t.startsWith('image/')) return t.split('/')[1] || 'bin';
    if (t.startsWith('video/')) return t.split('/')[1] || 'bin';
    if (t.startsWith('audio/')) return t.split('/')[1] || 'bin';
    if (t === 'application/pdf') return 'pdf';
    if (t === 'text/plain') return 'txt';
    return 'bin';
}

// Get both extension and modality from MIME type
export function parseContentType(t: string): { extension: string; modality: string } {
    return {
        extension: extFromType(t),
        modality: modalityFromType(t)
    };
}