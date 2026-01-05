import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  databaseURL: "https://realfitness-d55a9-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
