import { ObjectId } from 'mongodb';

export function toId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;
}
