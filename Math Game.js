import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBRN9ycs4D1LB5_WJKZF8bWbAYv4dMxu44",
    authDomain: "math-game-e6c73.firebaseapp.com",
    projectId: "math-game-e6c73",
    storageBucket: "math-game-e6c73.firebasestorage.app",
    messagingSenderId: "935257127881",
    appId: "1:935257127881:web:cfa563c15c414dcd6ec618"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements for Auth & UI
const authScreen = document.getElementById('authScreen');
const namePromptScreen = document.getElementById('namePromptScreen');
const cautionScreen = document.getElementById('cautionScreen');
const startMenu = document.getElementById('startMenu');
const profileModal = document.getElementById('profileModal');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');

const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const authError = document.getElementById('authError');
const inGameNameInput = document.getElementById('inGameNameInput');

let currentUserUid = null;
let currentPlayerData = null;
let currentUserData = null;
let isGuest = false;

const PRESET_AVATARS = [
    { id: 'math-bot', label: 'Math Bot', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2b5876"/><rect x="16" y="18" width="32" height="28" rx="6" fill="#4e4376" stroke="#ffe08a" stroke-width="2.5"/><circle cx="25" cy="30" r="4" fill="#75d6df"/><circle cx="39" cy="30" r="4" fill="#75d6df"/><rect x="24" y="38" width="16" height="3" rx="1.5" fill="#ffe08a"/><line x1="32" y1="8" x2="32" y2="18" stroke="#ffe08a" stroke-width="3"/><circle cx="32" cy="8" r="3.5" fill="#ef5262"/></svg>` },
    { id: 'star-hero', label: 'Star Hero', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1f4037"/><polygon points="32,10 38.5,24 54,26 42.5,36.5 45.5,52 32,44.5 18.5,52 21.5,36.5 10,26 25.5,24" fill="#f5c451" stroke="#fff0a3" stroke-width="2"/><circle cx="27" cy="31" r="2.5" fill="#27243d"/><circle cx="37" cy="31" r="2.5" fill="#27243d"/></svg>` },
    { id: 'pi-wizard', label: 'Pi Wizard', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#3a1c71"/><path d="M14 24 L32 10 L50 24 Z" fill="#d76d77" stroke="#ffe08a" stroke-width="2"/><rect x="12" y="23" width="40" height="5" rx="2.5" fill="#f5c451"/><circle cx="32" cy="40" r="11" fill="#f1c3a5"/><circle cx="28" cy="39" r="2" fill="#27243d"/><circle cx="36" cy="39" r="2" fill="#27243d"/></svg>` },
    { id: 'cube-runner', label: 'Cube Runner', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1e3c72"/><polygon points="32,12 50,22 32,32 14,22" fill="#75d6df"/><polygon points="14,22 32,32 32,52 14,42" fill="#ad4a2f"/><polygon points="50,22 32,32 32,52 50,42" fill="#e7b74d"/></svg>` }
];

function svgToDataUrl(svgText) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);
}

let selectedAvatarUrl = svgToDataUrl(PRESET_AVATARS[0].svg);

// Create top-left Profile Button on main screen if not already in HTML
let profileBtn = document.getElementById('profileBtn');
if (!profileBtn) {
    profileBtn = document.createElement('button');
    profileBtn.id = 'profileBtn';
    profileBtn.type = 'button';
    document.body.appendChild(profileBtn);
}

Object.assign(profileBtn.style, {
    position: 'fixed',
    top: '14px',
    left: '14px',
    zIndex: '2500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    width: 'auto',
    minWidth: 'fit-content',
    maxWidth: 'calc(100vw - 28px)',
    height: 'auto',
    minHeight: '44px',
    padding: '7px 16px 7px 8px',
    borderRadius: '999px',
    border: '2px solid #ffe08a',
    background: 'rgba(24, 28, 48, 0.94)',
    color: '#ffffff',
    fontFamily: 'monospace, sans-serif',
    fontSize: '14px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    flexShrink: '0',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
});

const topLeftAvatarImg = document.createElement('img');
topLeftAvatarImg.alt = 'Profile';
topLeftAvatarImg.src = selectedAvatarUrl;
Object.assign(topLeftAvatarImg.style, {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    minHeight: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: '0',
    background: '#27243d'
});

const topLeftLabel = document.createElement('span');
topLeftLabel.textContent = 'Profile';
Object.assign(topLeftLabel.style, {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    overflow: 'visible',
    textOverflow: 'clip'
});

profileBtn.innerHTML = '';
profileBtn.appendChild(topLeftAvatarImg);
profileBtn.appendChild(topLeftLabel);

function isElementVisibleOverlay(el) {
    if (!el) return false;
    if (el.classList && el.classList.contains('hidden')) return false;
    if (el.style && el.style.display === 'none') return false;
    return true;
}

function syncTopLeftProfileButton() {
    const activeProfileModal = document.getElementById('profileModal') || profileModal;
    const activeNoticeModal = document.getElementById('passwordNoticeModal') || passwordNoticeModal;
    const onMainMenu = startMenu && !startMenu.classList.contains('hidden') && startMenu.style.display !== 'none';
    const overlayOpen = [authScreen, namePromptScreen, cautionScreen, activeProfileModal, activeNoticeModal].some(
        isElementVisibleOverlay
    );
    const activeName = (currentPlayerData && currentPlayerData.username)
        ? currentPlayerData.username
        : (isGuest ? 'Guest' : 'Profile');
    topLeftLabel.textContent = activeName;
    const avatarSrc = (currentPlayerData && currentPlayerData.avatar) ? currentPlayerData.avatar : selectedAvatarUrl;
    topLeftAvatarImg.src = avatarSrc;

    if (onMainMenu && !overlayOpen) {
        profileBtn.classList.remove('hidden');
        profileBtn.style.display = 'inline-flex';
        profileBtn.style.zIndex = '2500';
    } else {
        profileBtn.classList.add('hidden');
        profileBtn.style.display = 'none';
    }
}

// Build interactive Profile Modal & Password Request Modal if not present in HTML
let editNameInput = document.getElementById('editProfileNameInput');
let saveProfileBtn = document.getElementById('saveProfileBtn');
let avatarPresetsContainer = document.getElementById('avatarPresetsContainer');
let uploadAvatarInput = document.getElementById('uploadAvatarInput');
let profileAvatarPreview = document.getElementById('profileAvatarPreview');
let changePasswordBtn = document.getElementById('changePasswordBtn');
let passwordNoticeModal = document.getElementById('passwordNoticeModal');
let passwordNoticeText = document.getElementById('passwordNoticeText');
let passwordNoticeOkBtn = document.getElementById('passwordNoticeOkBtn');

function ensureProfileUiElements() {
    let modal = document.getElementById('profileModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'profileModal';
        modal.className = 'hidden';
        document.body.appendChild(modal);
    }

    Object.assign(modal.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '3000',
        background: 'rgba(10, 14, 28, 0.78)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'monospace, sans-serif'
    });

    if (!modal.dataset.built) {
        modal.innerHTML = `
            <div style="width:100%;max-width:420px;background:#1b2238;color:#fff;border:2px solid #ffe08a;border-radius:14px;padding:20px;box-shadow:0 16px 40px rgba(0,0,0,0.55);display:flex;flex-direction:column;gap:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h2 style="margin:0;font-size:18px;color:#ffe08a;">Player Profile</h2>
                    <button id="closeProfileBtn" type="button" style="background:#313b5c;color:#fff;border:1px solid #8fa3d9;border-radius:8px;padding:4px 10px;cursor:pointer;font-weight:bold;">✕</button>
                </div>

                <div style="display:flex;align-items:center;gap:12px;background:#121726;padding:10px;border-radius:10px;">
                    <img id="profileAvatarPreview" src="${selectedAvatarUrl}" alt="Avatar Preview" style="width:54px;height:54px;border-radius:50%;object-fit:cover;border:2px solid #75d6df;background:#27243d;" />
                    <div style="min-width:0;flex:1;">
                        <div id="profileName" style="font-size:15px;font-weight:bold;color:#fff;overflow:hidden;text-overflow:ellipsis;">Player</div>
                        <div id="profileEmail" style="font-size:12px;color:#a8b8e0;overflow:hidden;text-overflow:ellipsis;">Not signed in</div>
                    </div>
                </div>

                <div>
                    <div style="font-size:12px;color:#ffe08a;margin-bottom:6px;">Choose Profile Picture</div>
                    <div id="avatarPresetsContainer" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;"></div>
                    <label style="display:inline-block;background:#273459;color:#ffe08a;border:1px solid #5972b8;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;">
                        Upload Picture
                        <input id="uploadAvatarInput" type="file" accept="image/*" style="display:none;" />
                    </label>
                </div>

                <div>
                    <label for="editProfileNameInput" style="display:block;font-size:12px;color:#ffe08a;margin-bottom:4px;">Change Name</label>
                    <div style="display:flex;gap:8px;">
                        <input id="editProfileNameInput" type="text" placeholder="Enter new name" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid #5972b8;background:#0f1422;color:#fff;font-family:inherit;" />
                        <button id="saveProfileBtn" type="button" style="padding:8px 14px;border-radius:8px;border:none;background:#4cc97a;color:#0e1b13;font-weight:bold;cursor:pointer;">Save</button>
                    </div>
                    <div id="profileSaveStatus" style="font-size:12px;color:#7ef2a8;min-height:16px;margin-top:4px;"></div>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.12);">
                    <button id="changePasswordBtn" type="button" style="padding:9px 12px;border-radius:8px;border:1px solid #f5c451;background:#3a2e16;color:#ffe08a;font-weight:bold;cursor:pointer;">Change Password</button>
                    <button id="logoutBtn" type="button" style="padding:8px 12px;border-radius:8px;border:1px solid #ef5262;background:#381922;color:#ff9aa5;font-weight:bold;cursor:pointer;">Sign Out</button>
                </div>
            </div>
        `;
        modal.dataset.built = 'true';
    }

    if (!document.getElementById('passwordNoticeModal')) {
        const noticeModal = document.createElement('div');
        noticeModal.id = 'passwordNoticeModal';
        noticeModal.className = 'hidden';
        Object.assign(noticeModal.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '4000',
            background: 'rgba(6, 9, 18, 0.85)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: 'monospace, sans-serif'
        });
        noticeModal.innerHTML = `
            <div style="width:100%;max-width:380px;background:#1b2238;color:#fff;border:2px solid #ffe08a;border-radius:14px;padding:22px;box-shadow:0 16px 40px rgba(0,0,0,0.65);text-align:center;display:flex;flex-direction:column;gap:16px;">
                <p id="passwordNoticeText" style="margin:0;font-size:14px;line-height:1.5;color:#ffffff;">You'll soon be able to change your password. You'll get a message on gmail to change your password (this might take 48 to 72 hours)</p>
                <button id="passwordNoticeOkBtn" type="button" style="align-self:center;min-width:90px;padding:8px 20px;border-radius:8px;border:none;background:#f5c451;color:#1b2238;font-weight:bold;font-size:14px;cursor:pointer;">OK</button>
            </div>
        `;
        document.body.appendChild(noticeModal);
    }

    editNameInput = document.getElementById('editProfileNameInput');
    saveProfileBtn = document.getElementById('saveProfileBtn');
    avatarPresetsContainer = document.getElementById('avatarPresetsContainer');
    uploadAvatarInput = document.getElementById('uploadAvatarInput');
    profileAvatarPreview = document.getElementById('profileAvatarPreview');
    changePasswordBtn = document.getElementById('changePasswordBtn');
    passwordNoticeModal = document.getElementById('passwordNoticeModal');
    passwordNoticeText = document.getElementById('passwordNoticeText');
    passwordNoticeOkBtn = document.getElementById('passwordNoticeOkBtn');

    if (avatarPresetsContainer && !avatarPresetsContainer.dataset.built) {
        PRESET_AVATARS.forEach(preset => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.title = preset.label;
            btn.style.cssText = 'width:46px;height:46px;padding:2px;border-radius:10px;border:2px solid transparent;background:#121726;cursor:pointer;overflow:hidden;';
            const img = document.createElement('img');
            img.src = svgToDataUrl(preset.svg);
            img.alt = preset.label;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:8px;';
            btn.appendChild(img);
            btn.addEventListener('click', () => {
                selectedAvatarUrl = svgToDataUrl(preset.svg);
                if (profileAvatarPreview) profileAvatarPreview.src = selectedAvatarUrl;
                topLeftAvatarImg.src = selectedAvatarUrl;
                highlightSelectedPreset();
                persistProfileChanges();
            });
            avatarPresetsContainer.appendChild(btn);
        });
        avatarPresetsContainer.dataset.built = 'true';
    }
}

function highlightSelectedPreset() {
    if (!avatarPresetsContainer) return;
    const buttons = avatarPresetsContainer.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
        const presetUrl = svgToDataUrl(PRESET_AVATARS[idx].svg);
        btn.style.borderColor = (selectedAvatarUrl === presetUrl) ? '#ffe08a' : 'transparent';
    });
}

async function persistProfileChanges(newUsernameOverride = null) {
    const saveStatus = document.getElementById('profileSaveStatus');
    const resolvedName = (newUsernameOverride !== null ? newUsernameOverride : (editNameInput ? editNameInput.value.trim() : ''))
        || (currentPlayerData && currentPlayerData.username)
        || (isGuest ? 'Guest' : 'Player');

    if (!currentPlayerData) {
        currentPlayerData = {
            username: resolvedName,
            email: 'Not signed in',
            avatar: selectedAvatarUrl
        };
    } else {
        currentPlayerData.username = resolvedName;
        currentPlayerData.avatar = selectedAvatarUrl;
    }
    currentUserData = currentPlayerData;

    const pNameEl = document.getElementById('profileName');
    if (pNameEl) pNameEl.textContent = currentPlayerData.username;
    if (profileAvatarPreview) profileAvatarPreview.src = selectedAvatarUrl;
    topLeftAvatarImg.src = selectedAvatarUrl;
    topLeftLabel.textContent = currentPlayerData.username;

    localStorage.setItem('mathGameProfileCache', JSON.stringify({
        username: currentPlayerData.username,
        avatar: selectedAvatarUrl
    }));

    if (currentUserUid && !isGuest) {
        try {
            await setDoc(doc(db, "users", currentUserUid), {
                username: currentPlayerData.username,
                avatar: selectedAvatarUrl,
                updatedAt: new Date()
            }, { merge: true });
            if (saveStatus) saveStatus.textContent = 'Profile saved.';
        } catch (err) {
            console.error('Error saving profile:', err);
            if (saveStatus) saveStatus.textContent = 'Saved locally.';
        }
    } else if (saveStatus) {
        saveStatus.textContent = 'Saved locally.';
    }
}

async function dispatchPasswordChangeRequest(requesterEmail) {
    const recipients = ['parom.som.mom@gmail.com', 'fedorg@petone-central.school.nz'];
    const subject = `Password Change Request: ${requesterEmail}`;
    const body = `User ${requesterEmail} has requested to change their password in Math Game.`;

    // Record the request in Firestore if signed in
    if (currentUserUid && !isGuest) {
        try {
            await setDoc(doc(db, "passwordRequests", `${currentUserUid}_${Date.now()}`), {
                uid: currentUserUid,
                requesterEmail: requesterEmail,
                recipients: recipients,
                requestedAt: new Date(),
                status: 'pending'
            });
        } catch (err) {
            console.error('Failed to log password request in Firestore:', err);
        }
    }

    // Attempt background email delivery via FormSubmit AJAX endpoint for both recipients
    // without blocking or disrupting the user's on-screen confirmation modal
    recipients.forEach(recipient => {
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: subject,
                requester_email: requesterEmail,
                message: body
            })
        }).catch(() => {});
    });
}

function openProfileModal() {
    ensureProfileUiElements();
    const cachedRaw = localStorage.getItem('mathGameProfileCache');
    let cached = null;
    if (cachedRaw) {
        try { cached = JSON.parse(cachedRaw); } catch (_) {}
    }

    const displayName = (currentPlayerData && currentPlayerData.username)
        || (cached && cached.username)
        || (isGuest ? 'Guest' : 'Player');
    const displayEmail = (currentPlayerData && currentPlayerData.email)
        || (auth.currentUser && auth.currentUser.email)
        || 'Not signed in';
    const displayAvatar = (currentPlayerData && currentPlayerData.avatar)
        || (cached && cached.avatar)
        || selectedAvatarUrl;

    selectedAvatarUrl = displayAvatar;

    const pNameEl = document.getElementById('profileName');
    const pEmailEl = document.getElementById('profileEmail');
    const saveStatus = document.getElementById('profileSaveStatus');

    if (pNameEl) pNameEl.textContent = displayName;
    if (pEmailEl) pEmailEl.textContent = displayEmail;
    if (editNameInput) editNameInput.value = displayName;
    if (profileAvatarPreview) profileAvatarPreview.src = selectedAvatarUrl;
    if (saveStatus) saveStatus.textContent = '';

    highlightSelectedPreset();

    const modal = document.getElementById('profileModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    syncTopLeftProfileButton();
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    syncTopLeftProfileButton();
}

function showPasswordNoticeModal() {
    ensureProfileUiElements();
    const requesterEmail = (currentPlayerData && currentPlayerData.email)
        || (auth.currentUser && auth.currentUser.email)
        || 'Guest / Unknown Email';

    dispatchPasswordChangeRequest(requesterEmail);

    if (passwordNoticeText) {
        passwordNoticeText.textContent = "You'll soon be able to change your password. You'll get a message on gmail to change your password (this might take 48 to 72 hours)";
    }
    if (passwordNoticeModal) {
        passwordNoticeModal.classList.remove('hidden');
        passwordNoticeModal.style.display = 'flex';
    }
}

function hidePasswordNoticeModal() {
    const noticeModal = document.getElementById('passwordNoticeModal') || passwordNoticeModal;
    if (noticeModal) {
        noticeModal.classList.add('hidden');
        noticeModal.style.display = 'none';
    }
    syncTopLeftProfileButton();
}

ensureProfileUiElements();

profileBtn.addEventListener('click', () => {
    openProfileModal();
});

document.getElementById('closeProfileBtn').addEventListener('click', () => {
    closeProfileModal();
});

if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        const nextName = editNameInput ? editNameInput.value.trim() : '';
        if (!nextName) return;
        persistProfileChanges(nextName);
    });
}

if (uploadAvatarInput) {
    uploadAvatarInput.addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                selectedAvatarUrl = reader.result;
                if (profileAvatarPreview) profileAvatarPreview.src = selectedAvatarUrl;
                topLeftAvatarImg.src = selectedAvatarUrl;
                highlightSelectedPreset();
                persistProfileChanges();
            }
        };
        reader.readAsDataURL(file);
    });
}

if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
        showPasswordNoticeModal();
    });
}

if (passwordNoticeOkBtn) {
    passwordNoticeOkBtn.addEventListener('click', () => {
        hidePasswordNoticeModal();
    });
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    closeProfileModal();
    isGuest = false;
    await signOut(auth);
    syncTopLeftProfileButton();
});

function stopMovementKeys() {
    keys.left = false;
    keys.right = false;
}

// Listen to Firebase Auth state
onAuthStateChanged(auth, async (user) => {
    if (user && !isGuest) {
        currentUserUid = user.uid;
        await handleUserSession(user);
    } else if (!isGuest) {
        stopMovementKeys();
        authScreen.classList.remove('hidden');
        startMenu.classList.add('hidden');
        syncTopLeftProfileButton();
        soundManager.playTrack('auth');
    }
});

async function handleUserSession(user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const playerData = userDocSnap.data();
        if (!playerData.avatar) {
            playerData.avatar = selectedAvatarUrl;
        } else {
            selectedAvatarUrl = playerData.avatar;
        }
        currentPlayerData = playerData;
        currentUserData = playerData;
        authScreen.classList.add('hidden');
        namePromptScreen.classList.add('hidden');
        startMenu.classList.remove('hidden');
        syncTopLeftProfileButton();
        soundManager.playTrack('menu');

        if (playerData.lastLevel) {
            worldNumber = Math.max(1, Math.min(totalWorlds, Number(playerData.lastLevel)));
            localStorage.setItem('mathGameLastLevel', String(worldNumber));
            buildLevel(worldNumber);
            updateHud();
        }
    } else {
        authScreen.classList.add('hidden');
        processNewUser(user);
    }
}

async function processNewUser(user) {
    const email = user.email;
    let username = "";

    if (email && email.endsWith("@petone-central.school.nz")) {
        username = email.split('@')[0];
        await saveNewUserToDb(user.uid, email, username);
    } else {
        stopMovementKeys();
        namePromptScreen.classList.remove('hidden');
        syncTopLeftProfileButton();
        document.getElementById('saveNameBtn').onclick = async () => {
            const enteredName = inGameNameInput.value.trim();
            if (!enteredName) return;
            username = enteredName;
            namePromptScreen.classList.add('hidden');
            await saveNewUserToDb(user.uid, email, username);
        };
    }
}

async function saveNewUserToDb(uid, email, username) {
    const initialData = {
        uid: uid,
        email: email,
        username: username,
        avatar: selectedAvatarUrl,
        lastLevel: 1,
        createdAt: new Date()
    };
    await setDoc(doc(db, "users", uid), initialData);
    currentPlayerData = initialData;
    currentUserData = initialData;
    startMenu.classList.remove('hidden');
    syncTopLeftProfileButton();
    soundManager.playTrack('menu');
    buildLevel(1);
    updateHud();
}

// Auth buttons event listeners
document.getElementById('signInEmailBtn').addEventListener('click', async () => {
    try {
        authError.textContent = "";
        await signInWithEmailAndPassword(auth, authEmailInput.value, authPasswordInput.value);
    } catch (e) {
        authError.textContent = e.message;
    }
});

document.getElementById('signUpEmailBtn').addEventListener('click', async () => {
    try {
        authError.textContent = "";
        await createUserWithEmailAndPassword(auth, authEmailInput.value, authPasswordInput.value);
    } catch (e) {
        authError.textContent = e.message;
    }
});

document.getElementById('googleAuthBtn').addEventListener('click', async () => {
    try {
        authError.textContent = "";
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (e) {
        authError.textContent = e.message;
    }
});

// Don't sign in (Guest mode)
document.getElementById('dontSignInBtn').addEventListener('click', () => {
    authScreen.classList.add('hidden');
    cautionScreen.classList.remove('hidden');
    syncTopLeftProfileButton();
});

document.getElementById('closeCautionBtn').addEventListener('click', () => {
    isGuest = true;
    cautionScreen.classList.add('hidden');
    startMenu.classList.remove('hidden');
    syncTopLeftProfileButton();
    soundManager.playTrack('menu');
});

// Game Logic Code Below
async function saveProgressToCloud(level) {
    localStorage.setItem('mathGameLastLevel', String(level));
    if (!currentUserUid || isGuest) return;
    try {
        await setDoc(doc(db, "users", currentUserUid), {
            lastLevel: level,
            updatedAt: new Date()
        }, { merge: true });
    } catch (e) {
        console.error("Cloud save error:", e);
    }
}

// Web Audio API Sound & Background Music Engine
const soundManager = (() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    let bgmTimer = null;
    let bgmStep = 0;
    let bgmTrack = null;

    // Distinct melodies per screen (different note sequences, intervals, and voicings):
    // - auth: Minor-key contemplative theme (A minor / F major / E minor movement)
    // - menu: Upbeat major-key fanfare/waltz melody (C major / G major / F major)
    // - game: Adventurous D dorian / energetic platforming hook
    const tracks = {
        auth: {
            tempoMs: 520,
            notes: [
                { freq: 220.00, dur: 0.45, type: 'sine', gain: 0.012, bass: 0 },
                { freq: 0,      dur: 0.25, type: 'sine', gain: 0.001, bass: 0 },
                { freq: 261.63, dur: 0.45, type: 'sine', gain: 0.011, bass: 0 },
                { freq: 0,      dur: 0.25, type: 'sine', gain: 0.001, bass: 0 },
                { freq: 329.63, dur: 0.50, type: 'sine', gain: 0.011, bass: 0 },
                { freq: 0,      dur: 0.30, type: 'sine', gain: 0.001, bass: 0 },
                { freq: 293.66, dur: 0.45, type: 'sine', gain: 0.011, bass: 0 },
                { freq: 0,      dur: 0.35, type: 'sine', gain: 0.001, bass: 0 }
            ]
        },
        menu: {
            tempoMs: 260,
            notes: [
                { freq: 523.25, dur: 0.18, type: 'triangle', gain: 0.036, bass: 130.81 },
                { freq: 659.25, dur: 0.18, type: 'triangle', gain: 0.036, bass: 0 },
                { freq: 783.99, dur: 0.18, type: 'triangle', gain: 0.038, bass: 0 },
                { freq: 1046.50,dur: 0.24, type: 'triangle', gain: 0.038, bass: 196.00 },
                { freq: 987.77, dur: 0.18, type: 'triangle', gain: 0.036, bass: 0 },
                { freq: 880.00, dur: 0.18, type: 'triangle', gain: 0.036, bass: 174.61 },
                { freq: 783.99, dur: 0.22, type: 'triangle', gain: 0.036, bass: 0 },
                { freq: 698.46, dur: 0.18, type: 'triangle', gain: 0.035, bass: 146.83 },
                { freq: 659.25, dur: 0.18, type: 'triangle', gain: 0.036, bass: 0 },
                { freq: 587.33, dur: 0.18, type: 'triangle', gain: 0.035, bass: 196.00 },
                { freq: 659.25, dur: 0.18, type: 'triangle', gain: 0.036, bass: 0 },
                { freq: 523.25, dur: 0.28, type: 'triangle', gain: 0.038, bass: 130.81 }
            ]
        },
        game: {
            tempoMs: 260,
            notes: [
                { freq: 587.33, dur: 0.16, type: 'square', gain: 0.028, bass: 146.83 },
                { freq: 587.33, dur: 0.14, type: 'square', gain: 0.026, bass: 0 },
                { freq: 698.46, dur: 0.16, type: 'square', gain: 0.028, bass: 174.61 },
                { freq: 880.00, dur: 0.20, type: 'square', gain: 0.030, bass: 220.00 },
                { freq: 783.99, dur: 0.16, type: 'square', gain: 0.028, bass: 196.00 },
                { freq: 698.46, dur: 0.16, type: 'square', gain: 0.028, bass: 0 },
                { freq: 659.25, dur: 0.16, type: 'square', gain: 0.028, bass: 164.81 },
                { freq: 587.33, dur: 0.20, type: 'square', gain: 0.028, bass: 146.83 },
                { freq: 783.99, dur: 0.16, type: 'square', gain: 0.028, bass: 196.00 },
                { freq: 880.00, dur: 0.16, type: 'square', gain: 0.030, bass: 0 },
                { freq: 987.77, dur: 0.16, type: 'square', gain: 0.030, bass: 246.94 },
                { freq: 880.00, dur: 0.24, type: 'square', gain: 0.030, bass: 220.00 }
            ]
        }
    };

    function ensureContext() {
        if (!AudioCtx) return null;
        if (!ctx) {
            ctx = new AudioCtx();
        }
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    function playTone(freq, duration, type = 'square', gainPeak = 0.08, delay = 0, slideTo = null) {
        if (!freq || freq <= 0) return;
        const audio = ensureContext();
        if (!audio) return;
        const startTime = audio.currentTime + delay;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), startTime + duration);
        }
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
    }

    function clearLoop() {
        if (bgmTimer) {
            clearInterval(bgmTimer);
            bgmTimer = null;
        }
    }

    function tickBgm() {
        if (!bgmTrack || !tracks[bgmTrack]) return;
        const cfg = tracks[bgmTrack];
        const stepObj = cfg.notes[bgmStep % cfg.notes.length];
        if (stepObj.freq > 0) {
            playTone(stepObj.freq, stepObj.dur, stepObj.type, stepObj.gain, 0);
        }
        if (stepObj.bass > 0) {
            playTone(stepObj.bass, stepObj.dur * 1.1, 'sine', stepObj.gain * 0.75, 0);
        }
        bgmStep += 1;
    }

    return {
        ensureContext,
        playTrack(trackName) {
            const cfg = tracks[trackName];
            if (!cfg) return;
            ensureContext();
            if (bgmTrack === trackName && bgmTimer) return;
            clearLoop();
            bgmTrack = trackName;
            bgmStep = 0;
            tickBgm();
            bgmTimer = setInterval(tickBgm, cfg.tempoMs);
        },
        getCurrentTrack() {
            return bgmTrack;
        },
        startBgm() {
            this.playTrack('game');
        },
        stopBgm() {
            bgmTrack = null;
            clearLoop();
        },
        jump() {
            playTone(240, 0.16, 'square', 0.08, 0, 560);
        },
        coin() {
            playTone(987.77, 0.08, 'square', 0.08, 0);
            playTone(1318.51, 0.16, 'square', 0.08, 0.07);
        },
        boxHit() {
            playTone(330, 0.09, 'square', 0.08, 0, 490);
            playTone(587.33, 0.12, 'triangle', 0.08, 0.08);
        },
        mathCorrect() {
            playTone(523.25, 0.1, 'triangle', 0.09, 0);
            playTone(659.25, 0.1, 'triangle', 0.09, 0.09);
            playTone(783.99, 0.18, 'triangle', 0.09, 0.18);
        },
        mathWrong() {
            playTone(233.08, 0.14, 'sawtooth', 0.08, 0, 174.61);
            playTone(164.81, 0.22, 'sawtooth', 0.08, 0.14, 110);
        },
        enemyStomp() {
            playTone(440, 0.08, 'square', 0.09, 0, 660);
            playTone(660, 0.1, 'square', 0.07, 0.06, 880);
        },
        hurt() {
            playTone(220, 0.14, 'sawtooth', 0.1, 0, 120);
            playTone(146.83, 0.24, 'sawtooth', 0.1, 0.12, 82.41);
        },
        gameOver() {
            this.stopBgm();
            playTone(392.00, 0.18, 'sawtooth', 0.09, 0);
            playTone(349.23, 0.18, 'sawtooth', 0.09, 0.18);
            playTone(329.63, 0.18, 'sawtooth', 0.09, 0.36);
            playTone(261.63, 0.4, 'sawtooth', 0.1, 0.54, 130.81);
        },
        unlock() {
            this.stopBgm();
            playTone(523.25, 0.12, 'triangle', 0.09, 0);
            playTone(659.25, 0.12, 'triangle', 0.09, 0.12);
            playTone(783.99, 0.12, 'triangle', 0.09, 0.24);
            playTone(1046.50, 0.32, 'triangle', 0.1, 0.36);
        }
    };
})();

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const scoreLabel = document.getElementById('score');
const livesLabel = document.getElementById('lives');
const keysLabel = document.getElementById('keys');
const levelLabel = document.getElementById('level');
const message = document.getElementById('message');
const mathPanel = document.getElementById('mathPanel');
const mathQuestion = document.getElementById('mathQuestion');
const mathAnswer = document.getElementById('mathAnswer');
const successFade = document.getElementById('successFade');
const successPanel = document.getElementById('successPanel');
const nextWorldButton = document.getElementById('nextWorldButton');
const restartButton = document.getElementById('restartButton');
const continueButton = document.getElementById('continueButton');
const firstLevelButton = document.getElementById('firstLevelButton');
const chooseLevelButton = document.getElementById('chooseLevelButton');
const levelSelect = document.getElementById('levelSelect');
const exitButton = document.getElementById('exitButton');

const world = {
	width: 2400,
	height: 540,
	gravity: 0.65,
	groundY: 470
};

const keys = { left: false, right: false };
const player = {
	x: 80,
	y: 428,
	width: 30,
	height: 42,
	velocityX: 0,
	velocityY: 0,
	speed: 3.8,
	jumpPower: -12.5,
	grounded: false,
	invulnerable: 0
};

const platforms = [
	{ x: 0, y: 470, width: 700, height: 70 },
	{ x: 790, y: 470, width: 620, height: 70 },
	{ x: 1490, y: 470, width: 910, height: 70 },
	{ x: 280, y: 365, width: 220, height: 30 },
	{ x: 515, y: 300, width: 220, height: 30 },
	{ x: 875, y: 360, width: 210, height: 30 },
	{ x: 1110, y: 275, width: 220, height: 30 },
	{ x: 1560, y: 350, width: 220, height: 30 },
	{ x: 1810, y: 285, width: 220, height: 30 },
	{ x: 2070, y: 370, width: 220, height: 30 }
];

const coins = [
	{ x: 330, y: 325, collected: false }, { x: 565, y: 260, collected: false },
	{ x: 925, y: 315, collected: false }, { x: 1165, y: 230, collected: false },
	{ x: 1610, y: 305, collected: false }, { x: 1860, y: 240, collected: false },
	{ x: 2120, y: 325, collected: false }, { x: 1370, y: 420, collected: false }
];

const keyholes = [
	{ x: 2290, y: 240, collected: false },
	{ x: 2320, y: 240, collected: false },
	{ x: 2350, y: 240, collected: false }
];

const boxes = [
	{ x: 330, y: 365, size: 30, used: false },
	{ x: 930, y: 360, size: 30, used: false },
	{ x: 1600, y: 350, size: 30, used: false }
];

const enemies = [
	{ x: 555, spawnX: 555, y: 425, width: 30, height: 45, start: 500, end: 670, direction: 1 },
	{ x: 1000, spawnX: 1000, y: 425, width: 30, height: 45, start: 820, end: 1260, direction: -1 },
	{ x: 1700, spawnX: 1700, y: 425, width: 30, height: 45, start: 1530, end: 2010, direction: 1 }
];

function buildLevel(level) {
	let seed = level * 7919;
	const random = () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 4294967296;
	};
	const randomBetween = (minimum, maximum) => Math.floor(minimum + random() * (maximum - minimum + 1));
	const platformBlueprints = [
		{ x: 280, y: 365 }, { x: 515, y: 300 }, { x: 875, y: 360 },
		{ x: 1110, y: 275 }, { x: 1560, y: 350 }, { x: 1810, y: 285 }, { x: 2070, y: 370 }
	];
	const raisedPlatforms = [
		...platformBlueprints.map(platform => ({
			x: platform.x + randomBetween(-45, 45),
			y: Math.max(345, platform.y + randomBetween(-15, 15)),
			width: randomBetween(180, 260),
			height: 30
		}))
	];
	platforms.length = 0;
	platforms.push(
		{ x: 0, y: 470, width: 700, height: 70 },
		{ x: 790, y: 470, width: 620, height: 70 },
		{ x: 1490, y: 470, width: 910, height: 70 },
		...raisedPlatforms
	);

	coins.length = 0;
	raisedPlatforms.forEach(platform => {
		coins.push({
			x: platform.x + randomBetween(25, platform.width - 25),
			y: platform.y - randomBetween(35, 55),
			collected: false
		});
	});
	coins.push({ x: randomBetween(1260, 1380), y: randomBetween(390, 430), collected: false });

	boxes.length = 0;
	[randomBetween(0, 1), randomBetween(2, 3), randomBetween(4, 6)].forEach(platformIndex => {
		const platform = raisedPlatforms[platformIndex];
		boxes.push({
			x: platform.x + randomBetween(25, platform.width - 55),
			y: platform.y,
			size: 30,
			used: false
		});
	});

	keyholes.length = 0;
	[2290, 2320, 2350].forEach(x => keyholes.push({ x, y: 240, collected: false }));

	enemies.length = 0;
	[
		{ start: 500, end: 670 },
		{ start: 820, end: 1260 },
		{ start: 1530, end: 2010 }
	].forEach((enemy, index) => {
		const start = enemy.start + randomBetween(-30, 30);
		const end = enemy.end + randomBetween(-30, 30);
		const spawnX = randomBetween(start + 20, end - 20);
		enemies.push({
			x: spawnX,
			spawnX,
			y: 425,
			width: 30,
			height: 45,
			start,
			end,
			direction: (level + index) % 2 === 0 ? -1 : 1
		});
	});
	if (level % 3 === 0) {
		const start = 1100;
		const end = 1360;
		const spawnX = randomBetween(start + 20, end - 20);
		enemies.push({ x: spawnX, spawnX, y: 425, width: 30, height: 45, start, end, direction: -1 });
	}
}

let cameraX = 0;
let score = 0;
let lives = 3;
let keysCollected = 0;
let gameState = 'menu';
let lastTime = 0;
let activeChallenge = null;
let unlockElapsed = 0;
let worldNumber = Number(localStorage.getItem('mathGameLastLevel')) || 1;
const totalWorlds = 100;

for (let level = 1; level <= totalWorlds; level += 1) {
	const option = document.createElement('option');
	option.value = level;
	option.textContent = `Level ${level}`;
	levelSelect.appendChild(option);
}

buildLevel(worldNumber);

function startGame(level) {
	worldNumber = Math.max(1, Math.min(totalWorlds, level));
	saveProgressToCloud(worldNumber);
	resetGame();
	soundManager.startBgm();
	startMenu.classList.add('hidden');
	syncTopLeftProfileButton();
}

continueButton.addEventListener('click', () => {
	const savedLevel = Number(localStorage.getItem('mathGameLastLevel')) || 1;
	startGame(savedLevel);
});

firstLevelButton.addEventListener('click', () => startGame(1));
chooseLevelButton.addEventListener('click', () => startGame(Number(levelSelect.value)));

exitButton.addEventListener('click', () => {
	soundManager.stopBgm();
	saveProgressToCloud(worldNumber);
	gameState = 'menu';
	message.classList.remove('visible');
	mathPanel.classList.remove('visible');
	successFade.classList.remove('visible');
	successPanel.classList.remove('visible');
	soundManager.playTrack('menu');
	startMenu.classList.remove('hidden');
	syncTopLeftProfileButton();
});

function getGameZoom() {
	return Math.min(1.35, Math.max(1, canvas.clientHeight / 600));
}

function resizeCanvas() {
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
	const bounds = canvas.getBoundingClientRect();
	canvas.width = Math.floor(bounds.width * pixelRatio);
	canvas.height = Math.floor(bounds.height * pixelRatio);
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function intersects(first, second) {
	return first.x < second.x + second.width && first.x + first.width > second.x &&
		first.y < second.y + second.height && first.y + first.height > second.y;
}

function jump() {
	if (gameState === 'won' || gameState === 'lost') {
		resetGame();
		return;
	}
	if (player.grounded) {
		player.velocityY = player.jumpPower;
		player.grounded = false;
		soundManager.jump();
	}
}

function resetPlayer() {
	player.x = 80;
	player.y = 428;
	player.velocityX = 0;
	player.velocityY = 0;
	player.invulnerable = 1000;
	cameraX = 0;
}

function resetGame() {
	score = 0;
	lives = 3;
	keysCollected = 0;
	gameState = 'playing';
	soundManager.startBgm();
	buildLevel(worldNumber);
	resetPlayer();
	message.classList.remove('visible');
	mathPanel.classList.remove('visible');
	successFade.classList.remove('visible');
	successFade.style.opacity = '0';
	successPanel.classList.remove('visible');
	activeChallenge = null;
	unlockElapsed = 0;
	updateHud();
}

function hurtPlayer() {
	if (player.invulnerable > 0) return;
	lives -= 1;
	if (lives <= 0) {
		gameState = 'lost';
		soundManager.gameOver();
		message.textContent = 'GAME OVER - PRESS R OR JUMP';
		message.classList.add('visible');
	} else {
		soundManager.hurt();
		resetPlayer();
	}
	updateHud();
}

function updateHud() {
	scoreLabel.textContent = String(score).padStart(4, '0');
	livesLabel.textContent = lives;
	keysLabel.textContent = keysCollected;
	levelLabel.textContent = gameState === 'success' ? 'CLEAR' : `${worldNumber}-1`;
}

function createMathChallenge() {
	const type = Math.floor(Math.random() * 4);
	if (type === 0) {
		const denominator = 2 + Math.floor(Math.random() * 9);
		const first = 1 + Math.floor(Math.random() * (denominator - 1));
		const second = denominator - first;
		return { text: `${first}/${denominator} + ${second}/${denominator}`, answer: 1 };
	}
	if (type === 1) {
		const first = 1 + Math.floor(Math.random() * 12);
		const second = 1 + Math.floor(Math.random() * 12);
		return { text: `${first} x ${second}`, answer: first * second };
	}
	if (type === 2) {
		const first = 1 + Math.floor(Math.random() * 12);
		const second = 1 + Math.floor(Math.random() * 12);
		return { text: `${first * second} / ${first}`, answer: second };
	}
	const xValue = 1 + Math.floor(Math.random() * 10);
	const a = 1 + Math.floor(Math.random() * 5);
	const b = 1 + Math.floor(Math.random() * 20);
	const c = a * xValue + b;
	return { text: `${a} * X + ${b} = ${c}`, answer: xValue };
}

function openMathChallenge() {
	activeChallenge = createMathChallenge();
	mathQuestion.textContent = activeChallenge.text;
	mathAnswer.value = '';
	gameState = 'math';
	mathPanel.classList.add('visible');
	mathAnswer.focus();
}

function parseAnswer(value, challenge) {
	const trimmed = value.trim();
	if (challenge && challenge.text.includes('X')) {
		if (trimmed.includes('=')) {
			const parts = trimmed.split('=').map(p => p.trim().toLowerCase());
			if (parts.length === 2) {
				let valStr = '';
				if (parts[0] === 'x') valStr = parts[1];
				else if (parts[1] === 'x') valStr = parts[0];
				const num = Number(valStr);
				if (Number.isFinite(num)) return num;
			}
		} else {
			const cleaned = trimmed.toLowerCase().replace(/x/g, '').trim();
			const num = Number(cleaned);
			if (Number.isFinite(num)) return num;
		}
	}
	if (trimmed.includes('/')) {
		const parts = trimmed.split('/').map(Number);
		if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]) && parts[1] !== 0) {
			return parts[0] / parts[1];
		}
	}
	const number = Number(trimmed);
	return Number.isFinite(number) ? number : NaN;
}

function finishMathChallenge() {
	const answer = parseAnswer(mathAnswer.value, activeChallenge);
	if (answer === activeChallenge.answer) {
		keysCollected = Math.min(3, keysCollected + 1);
		score += 100;
		soundManager.mathCorrect();
		updateHud();
	} else {
		lives -= 1;
		if (lives <= 0) {
			gameState = 'lost';
			soundManager.gameOver();
			message.textContent = 'GAME OVER - PRESS R OR JUMP';
			message.classList.add('visible');
		} else {
			soundManager.mathWrong();
			resetPlayer();
			gameState = 'playing';
		}
		updateHud();
	}
	activeChallenge = null;
	mathPanel.classList.remove('visible');
	if (lives > 0) gameState = 'playing';
}

function startUnlockSequence() {
	gameState = 'unlocking';
	soundManager.unlock();
	unlockElapsed = 0;
	player.velocityX = 0;
	keys.left = false;
	keys.right = false;
}

function finishUnlockSequence() {
	gameState = 'success';
	successFade.classList.add('visible');
	successFade.style.opacity = '1';
	successPanel.classList.add('visible');
	updateHud();
}

mathPanel.addEventListener('submit', event => {
	event.preventDefault();
	finishMathChallenge();
});

restartButton.addEventListener('click', resetGame);
nextWorldButton.addEventListener('click', () => {
	worldNumber = Math.min(totalWorlds, worldNumber + 1);
	saveProgressToCloud(worldNumber);
	resetGame();
});

function update(delta) {
	if (gameState === 'unlocking') {
		unlockElapsed += delta;
		if (unlockElapsed >= 4600) finishUnlockSequence();
		return;
	}
	if (gameState !== 'playing') return;
	player.invulnerable = Math.max(0, player.invulnerable - delta);
	player.velocityX = (keys.left ? -player.speed : 0) + (keys.right ? player.speed : 0);
	player.velocityY += world.gravity;
	player.x += player.velocityX;
	player.y += player.velocityY;
	player.x = Math.max(0, Math.min(world.width - player.width, player.x));

	const previousBottom = player.y + player.height - player.velocityY;
	player.grounded = false;
	platforms.forEach(platform => {
		const fallingOntoPlatform = player.velocityY >= 0 && previousBottom <= platform.y &&
			player.y + player.height >= platform.y && player.x + player.width > platform.x && player.x < platform.x + platform.width;
		if (fallingOntoPlatform) {
			player.y = platform.y - player.height;
			player.velocityY = 0;
			player.grounded = true;
		}
	});

	coins.forEach(coin => {
		const coinBox = { x: coin.x - 10, y: coin.y - 14, width: 20, height: 28 };
		if (!coin.collected && intersects(player, coinBox)) {
			coin.collected = true;
			score += 100;
			soundManager.coin();
			updateHud();
		}
	});

	boxes.forEach(box => {
		const boxHitbox = { x: box.x, y: box.y, width: box.size, height: box.size };
		const hittingFromBelow = player.velocityY < 0 && player.y < box.y + box.size &&
			player.y + player.height > box.y && player.x + player.width > box.x && player.x < box.x + box.size;
		if (!box.used && hittingFromBelow && intersects(player, boxHitbox)) {
			box.used = true;
			player.velocityY = 0;
			soundManager.boxHit();
			openMathChallenge();
		}
	});

	enemies.forEach(enemy => {
		enemy.x += enemy.direction * 1.1;
		if (enemy.x <= enemy.start || enemy.x >= enemy.end) enemy.direction *= -1;
		if (intersects(player, enemy)) {
			if (player.velocityY > 0 && player.y + player.height - enemy.y < 20) {
				player.velocityY = player.jumpPower * 0.65;
				enemy.x = -100;
				score += 250;
				soundManager.enemyStomp();
				updateHud();
			} else {
				hurtPlayer();
			}
		}
	});

	if (player.y > world.height + 50) hurtPlayer();
	const finishZone = { x: 2260, y: 0, width: 120, height: world.groundY };
	if (keysCollected >= 3 && intersects(player, finishZone)) {
		startUnlockSequence();
	}
	cameraX += (player.x - cameraX - 220) * 0.08;
	cameraX = Math.max(0, Math.min(world.width - canvas.clientWidth / getGameZoom(), cameraX));
}

function drawBackground(width, height) {
	context.fillStyle = '#62c8d8';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#75d6df';
	for (let x = -((cameraX * 0.25) % 220) - 220; x < width + 220; x += 220) {
		context.beginPath();
		context.moveTo(x, 420);
		context.lineTo(x + 80, 330);
		context.lineTo(x + 170, 420);
		context.fill();
	}
	context.fillStyle = '#a6e4d3';
	for (let x = -((cameraX * 0.12) % 360) - 360; x < width + 360; x += 360) {
		context.fillRect(x, 410, 170, 60);
		context.fillRect(x + 110, 385, 180, 85);
	}
}

function drawWorld() {
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const zoom = getGameZoom();
	const verticalOffset = Math.max(0, height - world.height * zoom);
	drawBackground(width, height);
	context.save();
	context.translate(-cameraX * zoom, verticalOffset);
	context.scale(zoom, zoom);

	const gaps = [{ x: 700, width: 90 }, { x: 1410, width: 80 }];
	gaps.forEach(gap => {
		context.fillStyle = '#248fa7';
		context.fillRect(gap.x, world.groundY, gap.width, world.height - world.groundY);
	});

	platforms.forEach(platform => {
		context.fillStyle = '#ad4a2f';
		context.fillRect(platform.x, platform.y, platform.width, platform.height);
		context.fillStyle = '#e7b74d';
		context.fillRect(platform.x, platform.y, platform.width, 8);
	});

	boxes.forEach(box => {
		if (box.used) {
			context.fillStyle = '#8d6b4a';
			context.fillRect(box.x, box.y, box.size, box.size);
			context.fillStyle = '#5e4635';
			context.fillRect(box.x + 4, box.y + 4, box.size - 8, 4);
			context.fillRect(box.x + 4, box.y + box.size - 8, box.size - 8, 4);
			return;
		}
		context.fillStyle = '#7b3f2a';
		context.fillRect(box.x, box.y, box.size, box.size);
		context.fillStyle = '#d86b28';
		context.fillRect(box.x + 3, box.y + 3, box.size - 6, box.size - 6);
		context.fillStyle = '#f29a38';
		context.fillRect(box.x + 6, box.y + 6, box.size - 12, 3);
		context.fillRect(box.x + 6, box.y + 6, 3, box.size - 12);
		context.fillStyle = '#8d4428';
		context.fillRect(box.x + 6, box.y + box.size - 9, box.size - 12, 3);
		context.fillRect(box.x + box.size - 9, box.y + 6, 3, box.size - 12);
		context.fillStyle = '#ffe08a';
		context.fillRect(box.x + 9, box.y + 9, box.size - 18, box.size - 18);
		context.fillStyle = '#7b3f2a';
		context.font = 'bold 23px monospace';
		context.fillText('?', box.x + 8, box.y + 24);
	});

	coins.forEach(coin => {
		if (coin.collected) return;
		context.fillStyle = '#fff0a3';
		context.fillRect(coin.x - 5, coin.y - 14, 10, 28);
		context.fillStyle = '#f2a82d';
		context.fillRect(coin.x - 9, coin.y - 9, 18, 18);
		context.fillStyle = '#ffe36e';
		context.fillRect(coin.x - 4, coin.y - 7, 4, 14);
	});

	enemies.forEach(enemy => {
		if (enemy.x < -50) return;
		context.fillStyle = '#633c83';
		context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
		context.fillStyle = '#f1c3a5';
		context.fillRect(enemy.x + 5, enemy.y + 7, 20, 14);
		context.fillStyle = '#27243d';
		context.fillRect(enemy.x + 7, enemy.y + 12, 4, 4);
		context.fillRect(enemy.x + 19, enemy.y + 12, 4, 4);
		context.fillRect(enemy.x - 2, enemy.y + enemy.height - 5, 12, 5);
		context.fillRect(enemy.x + 20, enemy.y + enemy.height - 5, 12, 5);
	});

	context.save();
	context.globalAlpha = 0.35;
	context.fillStyle = '#ffe36e';
	context.fillRect(2260, -80, 120, world.groundY + 80);
	context.restore();

	keyholes.forEach(keyhole => {
		if (keyhole.collected) return;
		context.save();
		context.globalAlpha = 0.9;
		context.fillStyle = '#9b5524';
		context.fillRect(keyhole.x - 6, keyhole.y - 13, 12, 8);
		context.fillRect(keyhole.x - 3, keyhole.y - 5, 6, 14);
		context.fillStyle = '#ffe36e';
		context.fillRect(keyhole.x - 4, keyhole.y - 11, 9, 5);
		context.fillRect(keyhole.x - 1, keyhole.y - 3, 3, 11);
		context.fillStyle = '#fff0a3';
		context.fillRect(keyhole.x - 3, keyhole.y - 10, 2, 2);
		context.restore();
	});

	if (gameState === 'unlocking') {
		const fadeProgress = Math.max(0, Math.min(1, (unlockElapsed - 2700) / 1900));
		const starts = [
			{ x: player.x + 8, y: player.y - 15 },
			{ x: player.x + 18, y: player.y - 28 },
			{ x: player.x + 28, y: player.y - 15 }
		];
		keyholes.forEach((keyhole, index) => {
			const flightProgress = Math.max(0, Math.min(1, (unlockElapsed - index * 450) / 1200));
			const start = starts[index];
			const keyX = start.x + (keyhole.x - start.x) * flightProgress;
			const keyY = start.y + (keyhole.y - start.y) * flightProgress;
			context.fillStyle = '#9b5524';
			context.fillRect(keyX - 5, keyY - 8, 10, 4);
			context.fillRect(keyX - 2, keyY - 4, 4, 13);
			context.fillStyle = '#ffe36e';
			context.fillRect(keyX - 3, keyY - 7, 6, 3);
			context.fillRect(keyX - 1, keyY - 3, 2, 10);
		});
		if (fadeProgress > 0) {
			context.fillStyle = `rgba(255, 255, 255, ${fadeProgress})`;
			context.fillRect(0, 0, width / zoom, height / zoom);
		}
	}

	if (player.invulnerable === 0 || Math.floor(player.invulnerable / 100) % 2 === 0) {
		context.fillStyle = '#ef5262';
		context.fillRect(player.x + 3, player.y, 24, 10);
		context.fillStyle = '#f1c3a5';
		context.fillRect(player.x + 7, player.y + 9, 17, 14);
		context.fillStyle = '#3a3157';
		context.fillRect(player.x + 5, player.y + 22, 20, 13);
		context.fillStyle = '#f5c451';
		context.fillRect(player.x + 2, player.y + 35, 11, 7);
		context.fillRect(player.x + 19, player.y + 35, 11, 7);
		context.fillStyle = '#27243d';
		context.fillRect(player.x + 20, player.y + 13, 4, 4);
	}
	context.restore();
}

function gameLoop(timestamp) {
	const delta = Math.min(32, timestamp - lastTime || 16);
	lastTime = timestamp;
	update(delta);
	drawWorld();
	requestAnimationFrame(gameLoop);
}

function setKey(key, value) {
	keys[key] = value;
}

function isUiInputActive() {
	const activeEl = document.activeElement;
	if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
		return true;
	}
	const overlays = [authScreen, namePromptScreen, cautionScreen, document.getElementById('profileModal'), document.getElementById('passwordNoticeModal')];
	return overlays.some(el => el && !el.classList.contains('hidden') && el.style.display !== 'none');
}

window.addEventListener('keydown', event => {
	if (isUiInputActive()) return;
	const movementKey = { ArrowLeft: 'left', ArrowRight: 'right', KeyA: 'left', KeyD: 'right' }[event.code];
	if (movementKey || ['ArrowUp', 'KeyW', 'Space', 'KeyR'].includes(event.code)) event.preventDefault();
	if (movementKey) setKey(movementKey, true);
	if (['ArrowUp', 'KeyW', 'Space'].includes(event.code)) jump();
	if (event.code === 'KeyR') resetGame();
});

window.addEventListener('keyup', event => {
	const movementKey = { ArrowLeft: 'left', ArrowRight: 'right', KeyA: 'left', KeyD: 'right' }[event.code];
	if (movementKey) setKey(movementKey, false);
});

window.addEventListener('blur', () => {
	setKey('left', false);
	setKey('right', false);
});

window.addEventListener('pointerdown', () => {
	soundManager.ensureContext();
	if (!soundManager.getCurrentTrack()) {
		if (authScreen && !authScreen.classList.contains('hidden')) {
			soundManager.playTrack('auth');
		} else if (startMenu && !startMenu.classList.contains('hidden')) {
			soundManager.playTrack('menu');
		}
	}
}, { once: false, passive: true });
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateHud();
requestAnimationFrame(gameLoop);
