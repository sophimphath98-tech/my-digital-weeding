import { customAlphabet } from "nanoid";

// No 0/O/1/l/I to keep codes easy to read aloud or type.
export const newGuestCode = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 8);
