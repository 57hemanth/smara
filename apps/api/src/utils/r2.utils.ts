export function sanitizePathSegment(s?: string) {
    if (!s) return '';
    return s.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
}

export function extFromType(t: string) {
    if (t.startsWith('image/')) return t.split('/')[1] || 'bin';
    if (t.startsWith('video/')) return t.split('/')[1] || 'bin';
    if (t.startsWith('audio/')) return t.split('/')[1] || 'bin';
    if (t === 'application/pdf') return 'pdf';
    if (t === 'text/plain') return 'txt';
    return 'bin';
}