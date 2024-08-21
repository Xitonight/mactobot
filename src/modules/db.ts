import { MongoClient } from "mongodb";
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
const database = client.db("mactobot");

interface cache {
  msgId: number;
  chatId: number;
  userId: number;
  date: string;
  time: string;
}

export const cache = database.collection<cache>("cache");
