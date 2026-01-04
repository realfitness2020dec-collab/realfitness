import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, push, remove, update, query, orderByChild, equalTo, limitToLast, startAt, endAt } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  databaseURL: "https://realfitness-d55a9-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Export database utilities
export { ref, get, set, push, remove, update, query, orderByChild, equalTo, limitToLast, startAt, endAt };
