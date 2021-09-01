export const svgToPng = (svg: string) => {
  const lCanvas = document.createElement('canvas');
  lCanvas.setAttribute('id', 'canvas');
  document.body.appendChild(lCanvas);

  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  const ctx = canvas.getContext('2d');

  const base64 = new Promise<string>((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      const base64 = canvas.toDataURL('image/png');
      document.body.removeChild(lCanvas);
      URL.revokeObjectURL(url);

      resolve(base64);
    };

    img.src = url;
  });

  return base64;
};
