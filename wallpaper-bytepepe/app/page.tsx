'use client';

export default function Home() {
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/generate', {
      method: 'POST',
      body: form
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Wallpaper-BytePepe.png';
    a.click();
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Wallpaper BytePepe</h1>
      <p>Pixel NFT → Ultra HQ Phone Wallpaper</p>
      <input type="file" accept="image/png" onChange={handleUpload} />
    </main>
  );
}