import { db } from '../firebase';
import {
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    getDoc,
} from 'firebase/firestore';

// generate short random id for share links
export function genShareId() {
    return Math.random().toString(36).slice(2, 10);
}

// create session doc with role ('edit' | 'view') and ownerId (optional)
export async function createSessionDoc(sessionId: string, project: any, role: 'edit' | 'view' = 'edit', ownerId?: string) {
    const ref = doc(db, 'sessions', sessionId);
    await setDoc(ref, {
        project: serializeProject(project),
        role,
        ownerId: ownerId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastClient: null,
    });
    return sessionId;
}

// write/update session (sets lastClient)
export async function writeSessionProject(sessionId: string, project: any, clientId: string) {
    const ref = doc(db, 'sessions', sessionId);
    const payload = {
        project: serializeProject(project),
        updatedAt: serverTimestamp(),
        lastClient: clientId,
    };
    try {
        await updateDoc(ref, payload);
    } catch {
        // if doc doesn't exist, create it
        await setDoc(ref, {
            ...payload,
            role: 'edit',
            ownerId: null,
            createdAt: serverTimestamp(),
        });
    }
}

export async function getSessionOnce(sessionId: string) {
    try {
        const ref = doc(db, 'sessions', sessionId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            return null;
        }
        const d = snap.data();
        if (d && d.project) {
            d.project = deserializeProject(d.project);
        }
        return d;
    } catch (err) {
        console.warn('getSessionOnce error', err);
        return null;
    }
}

// subscribeSession: real-time listener, returns unsubscribe function
export function subscribeSession(sessionId: string, onChange: (data: any) => void) {
    const ref = doc(db, 'sessions', sessionId);
    const unsub = onSnapshot(ref, (snap) => {
        if (!snap.exists()) {
            onChange(null);
            return;
        }
        const d = snap.data();
        if (d && d.project) {
            d.project = deserializeProject(d.project);
        }
        onChange(d);
    }, (err) => {
        console.warn('subscribeSession onSnapshot error', err);
        onChange(null);
    });
    return unsub;
}

// helpers to convert Date <-> ISO to keep Firestore payload simple
function serializeProject(p: any) {
    if (!p) return p;
    const copy = { ...p };
    if (copy.createdAt instanceof Date) copy.createdAt = copy.createdAt.toISOString();
    if (copy.updatedAt instanceof Date) copy.updatedAt = copy.updatedAt.toISOString();
    if (Array.isArray(copy.slides)) {
        copy.slides = copy.slides.map((s: any) => ({ ...s }));
    }
    return copy;
}

function deserializeProject(p: any) {
    if (!p) return p;
    const copy = { ...p };
    if (typeof copy.createdAt === 'string') copy.createdAt = new Date(copy.createdAt);
    if (typeof copy.updatedAt === 'string') copy.updatedAt = new Date(copy.updatedAt);
    return copy;
}
