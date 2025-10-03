import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, onSnapshot, query, setLogLevel } from 'firebase/firestore'; // setLogLevel import kiya gaya

// Global variables provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// CSS Styles (Inline Tailwind CSS for consistency)
const styles = {
    darkBg: 'bg-[#1C1C28]',
    moduleBg: 'bg-[#282838]',
    mainText: 'text-gray-100',
    accentBlue: 'text-[#4A90E2]',
    accentGreen: 'bg-[#7ED321] hover:bg-[#61b816] text-[#1C1C28]',
    warningRed: 'text-[#D0021B]',
    warningYellow: 'text-[#FFC400]',
    borderColor: 'border-[#3B3B52]',
    logAreaBg: 'bg-[#15151F]',
    fontMono: 'font-mono',
};

// --- Firebase Initialization and Auth ---
let db = null;
let auth = null;

const initializeFirebase = async (setUserId, setIsAuthReady, setDbStatus) => { // setDbStatus add kiya gaya
    try {
        // Firestore log level ko debug par set karna (Set Firestore log level to debug)
        setLogLevel('debug');

        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        setDbStatus('Authenticating...'); // Status update
        
        // Use custom token if available, otherwise sign in anonymously
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
        
        const currentUserId = auth.currentUser?.uid || crypto.randomUUID();
        setUserId(currentUserId);
        setIsAuthReady(true);
        setDbStatus('Connected'); // Status update
        console.log(`[Firebase] Authenticated as User ID: ${currentUserId}`);
    } catch (error) {
        console.error("[Firebase] Initialization or Authentication failed:", error);
        // Fallback for UI even if authentication fails
        setUserId('ANON_GUEST');
        setIsAuthReady(true);
        setDbStatus('Error'); // Status update
    }
};

// --- Log Component ---
const LogLine = ({ message, type = 'blue' }) => {
    let colorClass = styles.accentBlue;
    if (type === 'green') colorClass = styles.accentGreen.split(' ')[0];
    if (type === 'red') colorClass = styles.warningRed;
    if (type === 'yellow') colorClass = styles.warningYellow;

    return (
        <div className={`text-xs p-0.5 ${colorClass}`}>
            {message}
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [target, setTarget] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [usernameLog, setUsernameLog] = useState([]);
    const [emailLog, setEmailLog] = useState([]);
    const [hashLog, setHashLog] = useState([]);
    const [imageLog, setImageLog] = useState([]);
    const [imageGallery, setImageGallery] = useState([]);
    const [selectedImage, setSelectedImage] = useState('');
    
    // Firebase State
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [dbStatus, setDbStatus] = useState('Initializing'); // Naya state shamil kiya gaya

    // 1. Firebase Initialization Effect
    useEffect(() => {
        initializeFirebase(setUserId, setIsAuthReady, setDbStatus); // setDbStatus ko pass kiya gaya
    }, []);

    // 2. Real-time Gallery Data Listener
    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;

        // Path: /artifacts/{appId}/users/{userId}/osint_gallery
        const galleryPath = `artifacts/${appId}/users/${userId}/osint_gallery`;
        const q = query(collection(db, galleryPath));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setImageGallery(items.sort((a, b) => b.timestamp - a.timestamp)); // Sort by newest
            console.log(`[Firestore] Gallery updated with ${items.length} items.`);
            // Snapshot successful, connection is likely healthy
            setDbStatus('Connected'); 
        }, (error) => {
            console.error("[Firestore] Gallery snapshot error:", error);
            // Error handling ke dauran status update
            setDbStatus('Disconnected');
        });

        return () => unsubscribe();
    }, [isAuthReady, userId]);

    // --- OSINT Logic Functions (Simulated API Calls) ---

    const clearLogs = () => {
        setUsernameLog([]);
        setEmailLog([]);
        setHashLog([]);
        setImageLog([]);
    };

    const runUsernameScan = async (target) => {
        const log = (msg, type = 'blue') => setUsernameLog(prev => [...prev, { msg, type }]);
        log(`[SCAN] Username search started on 50+ platforms...`, 'blue');

        await new Promise(r => setTimeout(r, 1500));
        
        const foundOn = target.length > 5 ? ['Twitter', 'GitHub', 'Reddit', 'Instagram'] : ['None'];
        log(`[RESULT] Profile Name Scan Complete.`, 'green');

        if (foundOn.includes('Twitter')) {
            log(`[MATCH] 🐦 Found on Twitter. Account created 2018.`, 'red');
        }
        if (foundOn.includes('GitHub')) {
            log(`[MATCH] 🧑‍💻 Found on GitHub. Last contribution: 3 days ago.`, 'red');
        }
        if (foundOn.includes('Reddit')) {
            log(`[MATCH] 📢 Found on Reddit. Active in r/security.`, 'yellow');
        }
        if (foundOn[0] === 'None') {
            log(`[CLEAN] No strong matches found across major platforms.`, 'green');
        }
    };

    const runEmailScan = async (target) => {
        const log = (msg, type = 'blue') => setEmailLog(prev => [...prev, { msg, type }]);
        log(`[CHECK] Cross-referencing 10+ major breach APIs...`, 'blue');

        await new Promise(r => setTimeout(r, 2000));
        
        // Advanced Breach Simulation Logic
        const breaches = [];
        if (target.includes('amazon')) breaches.push({ name: 'Amazon (2020)', exposed: 'Email, Address' });
        if (target.includes('linked')) breaches.push({ name: 'LinkedIn (2016)', exposed: 'Email, Hashed Password' });
        if (target.includes('root') || target.includes('admin')) breaches.push({ name: 'Data Leak (2023)', exposed: 'Plaintext Password' });

        if (breaches.length > 0) {
            log(`[CRITICAL] 🚨 Target found in ${breaches.length} major data breaches!`, 'red');
            breaches.forEach(b => {
                log(`- BREACH: ${b.name} se data leak hua.`, 'red');
                log(`  EXPOSED: ${b.exposed}`, 'yellow');
            });
        } else {
            log(`[CLEAN] No critical breach data found on record.`, 'green');
        }
    };

    const runImageScan = async (imageUrl) => {
        const log = (msg, type = 'blue') => setImageLog(prev => [...prev, { msg, type }]);
        log(`[SEARCH] Starting Deep Reverse Image Scan on major engines...`, 'blue');

        await new Promise(r => setTimeout(r, 2500));
        
        if (imageUrl.includes('profile')) {
            log(`[MATCH] Image matched 4 times on LinkedIn and Portfolio Site.`, 'red');
            log(`[GEO] Simulated EXIF Data: Last known location metadata found.`, 'yellow');
        } else {
            log(`[CLEAN] No significant matches found across reverse search engines.`, 'green');
        }
    };
    
    // Hash Scan remains simple for now
    const runHashScan = async (target) => {
        const log = (msg, type = 'blue') => setHashLog(prev => [...prev, { msg, type }]);
        log(`[DICTIONARY] Checking Rainbow Tables & Known Password Lists...`, 'blue');
        await new Promise(r => setTimeout(r, 1000));
        if (target.startsWith('8d969eef')) { // Simulated match
            log(`[CRACKED] Hash Matched! Password is 'test123'.`, 'red');
        } else {
            log(`[CLEAN] Hash not found in common databases. Safe.`, 'green');
        }
    };

    // --- Firestore Gallery Functions ---

    const addImageToGallery = async () => {
        if (dbStatus !== 'Connected') { // Connection status check shamil kiya gaya
            alert("Database is not connected. Kripya wait karein ya connection check karein.");
            return;
        }
        if (!isAuthReady || !db || !userId || !target) {
            alert("Database ready nahi hai ya target empty hai. Kripya wait karein.");
            return;
        }

        if (!target.startsWith('http') && !target.endsWith('.jpg')) {
            alert("Please enter a valid-looking Image URL or descriptive Name.");
            return;
        }
        
        try {
            const galleryPath = `artifacts/${appId}/users/${userId}/osint_gallery`;
            await addDoc(collection(db, galleryPath), {
                name: target.length > 50 ? target.substring(0, 47) + '...' : target,
                url: target, // In a real app, this would be the actual Storage URL
                timestamp: Date.now(),
                source: userId,
            });
            setTarget('');
            alert('Picture successfully gallery mein add ho gayi hai!');
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Picture gallery mein add nahi ho saki: " + e.message);
        }
    };

    // --- Main Execution Function ---

    const handleSearch = () => {
        if (!target) return;

        setIsLoading(true);
        clearLogs();
        
        // Run all four modules concurrently (simulated)
        const allTasks = [
            runUsernameScan(target),
            runEmailScan(target),
            runHashScan(target),
            runImageScan(selectedImage || target), // Use selected image if available, else use target
        ];

        Promise.all(allTasks).finally(() => {
            setIsLoading(false);
        });
    };
    
    // DB status ke liye color helper function
    const getStatusColor = (status) => {
        if (status === 'Connected') return 'text-green-500';
        if (status === 'Error' || status === 'Disconnected') return 'text-red-500';
        return 'text-yellow-500';
    };

    return (
        <div className={`${styles.darkBg} ${styles.mainText} ${styles.fontMono} min-h-screen p-6`}>
            <div className="max-w-[1400px] mx-auto">
                <header className="text-center pb-4 mb-8 border-b-2 border-[#4A90E2]">
                    <h1 className={`${styles.accentBlue} text-5xl uppercase tracking-widest font-bold`}>
                        Tech-X-OSINT Pro
                    </h1>
                    <p className="mt-2 text-xl opacity-80">Full Spectrum Intelligence Aggregator | Created by Arbab</p>
                    <div className="text-sm mt-1 text-gray-500 flex justify-center gap-4">
                        <p>
                            USER ID: <span className="text-xs text-yellow-400">{userId || 'Loading...'}</span>
                        </p>
                        <p>
                            DB STATUS: <span className={`text-xs font-bold ${getStatusColor(dbStatus)}`}>{dbStatus}</span>
                        </p>
                    </div>
                </header>

                {/* Main Input and Action */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <input
                        type="text"
                        id="mainInput"
                        placeholder="Username, Email, Hash, or Image URL yahan enter karein..."
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className={`flex-grow p-4 ${styles.borderColor} border-2 ${styles.moduleBg} ${styles.mainText} text-lg outline-none focus:border-[#7ED321]`}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSearch}
                        className={`${styles.accentGreen} p-4 font-bold text-lg whitespace-nowrap transition-transform duration-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'ANALYZING...' : 'RUN FULL OSINT SCAN'}
                    </button>
                    <button
                        onClick={addImageToGallery}
                        className={`bg-[#00B0FF] hover:bg-[#008fcc] text-[#1C1C28] p-4 font-bold text-lg whitespace-nowrap transition-colors`}
                        disabled={isLoading || dbStatus !== 'Connected'} // DB status par disable kiya gaya
                    >
                        + ADD PIC TO GALLERY
                    </button>
                </div>

                {isLoading && (
                    <div className="w-full h-2 bg-[#3B3B52] mb-6 overflow-hidden">
                        <div className="h-full bg-[#4A90E2] animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                )}
                
                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* Module 1: Username & Social Profile Aggregation */}
                    <Module title="[01] Username / Multi-Site Check" logs={usernameLog} />

                    {/* Module 2: Email & Detailed Breach Check */}
                    <Module title="[02] Email & Specific Breach Check" logs={emailLog} />
                    
                    {/* Module 3: Hash & Password Vulnerability */}
                    <Module title="[03] Hash / Password Analysis" logs={hashLog} />

                    {/* Module 4: Image Gallery & Reverse Search */}
                    <div className={`${styles.moduleBg} p-5 ${styles.borderColor} border lg:col-span-3`}>
                        <h2 className={`text-xl ${styles.accentBlue} border-b-2 border-[#3B3B52] pb-3 mb-4`}>
                            [04] Image Gallery & Reverse Search
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Gallery Panel */}
                            <div className="w-full md:w-1/3">
                                <h3 className="text-lg text-yellow-400 mb-3">Saved Pictures (Gallery)</h3>
                                <div className={`h-40 overflow-y-auto p-2 ${styles.logAreaBg}`}>
                                    {imageGallery.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Koi picture gallery mein nahi hai.</p>
                                    ) : (
                                        imageGallery.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedImage(item.url)}
                                                className={`p-1 text-sm truncate cursor-pointer hover:bg-[#4A90E2]/30 transition ${selectedImage === item.url ? 'bg-[#7ED321]/30 border-l-4 border-[#7ED321]' : 'border-l-4 border-transparent'}`}
                                            >
                                                {item.name}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button
                                    onClick={() => { if(selectedImage) handleSearch(); }}
                                    className={`w-full mt-3 p-2 text-sm font-bold ${selectedImage ? styles.accentGreen : 'bg-gray-600 cursor-not-allowed'}`}
                                    disabled={!selectedImage || isLoading}
                                >
                                    {selectedImage ? 'SCAN SELECTED IMAGE' : 'SELECT IMAGE TO SCAN'}
                                </button>
                            </div>
                            
                            {/* Image Search Log */}
                            <div className="w-full md:w-2/3">
                                <h3 className="text-lg text-yellow-400 mb-3">Reverse Search Log</h3>
                                <div className={`h-40 overflow-y-auto ${styles.logAreaBg} p-2`}>
                                    {imageLog.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Image scan ke results yahan dikhenge.</p>
                                    ) : (
                                        imageLog.map((log, index) => <LogLine key={index} message={log.msg} type={log.type} />)
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                    
                </div>
            </div>
            
            <footer className="footer">
                <p className="text-sm opacity-60">WARNING: Yeh platform sirf authorized security research ke liye hai. | Tech-X-OSINT Pro</p>
            </footer>
        </div>
    );
};

// Reusable Module Component
const Module = ({ title, logs }) => (
    <div className={`${styles.moduleBg} p-5 ${styles.borderColor} border`}>
        <h2 className={`text-xl ${styles.accentBlue} border-b-2 border-[#3B3B52] pb-3 mb-4`}>
            {title}
        </h2>
        <div className={`h-48 overflow-y-auto ${styles.logAreaBg} p-2`}>
            {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">Aapka result yahan dikhega...</p>
            ) : (
                logs.map((log, index) => <LogLine key={index} message={log.msg} type={log.type} />)
            )}
        </div>
    </div>
);

export default App;
