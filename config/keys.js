// imports
import dotenv from "dotenv";

// configure dotenv
dotenv.config();

// set necessary keys
const devkey = {
  DB_URL: process.env.DEV_DB_URL,
  SECRET_KEY: process.env.SECRET_KEY
};

const prodKey = {
  DB_URL: process.env.DB_URL,
  SECRET_KEY: process.env.SECRET_KEY
};

const testKey = {
  DB_URL: process.env.TEST_DB_URL,
  SECRET_KEY: process.env.SECRET_KEY
};

const exportKeys = {}

if (process.env.NODE_ENV === 'production') {
  exportKeys.keys = prodKey;
} else if (process.env.NODE_ENV === 'testing') {
  exportKeys.keys = testKey;
} else {
  exportKeys.keys = devkey;
}

export default exportKeys;
