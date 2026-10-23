"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Entry = {
  id: string;
  name: string;
  message: string;
  createdAt: Timestamp | null;
};

const formatDate = (ts: Timestamp | null) =>
  ts
    ? ts.toDate().toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "방금 전";

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "guestbook"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEntries(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Entry, "id">),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("글을 불러오지 못했어요. 환경변수와 Firestore 설정을 확인해 주세요.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) {
      setError("이름과 내용을 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "guestbook"), {
        name: trimmedName,
        message: trimmedMessage,
        createdAt: serverTimestamp(),
      });
      setMessage("");
    } catch (err) {
      console.error(err);
      setError("글을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold">야렵일지</h1>
      <p className="mt-2 text-sm text-gray-500">다녀가신 흔적을 남겨주세요.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="이름"
          className="w-full rounded-lg border border-[#A8D4F5] bg-white px-4 py-2 outline-none focus:border-[#8CC3EE]"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="남기고 싶은 말을 적어주세요"
          className="w-full resize-none rounded-lg border border-[#A8D4F5] bg-white px-4 py-2 outline-none focus:border-[#8CC3EE]"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{message.length} / 1010</span>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#A8D4F5] px-5 py-2 text-[#3A5A78] transition hover:bg-[#8CC3EE] disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "일지 제출"}
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      <section className="mt-10 space-y-4">
        {loading ? (
          <p className="text-gray-400">불러오는 중...</p>
        ) : entries.length === 0 ? (
          <p className="text-gray-400">아직 제출된 일지가 없어요. 첫 일지를 남겨보세요.</p>
        ) : (
          entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-lg border border-[#A8D4F5] bg-white p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <strong>{entry.name}</strong>
                <span className="text-xs text-gray-400">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                {entry.message}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}