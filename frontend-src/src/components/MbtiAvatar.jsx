'use client';
/**
 * MbtiAvatar — uses the uploaded MBTI character sprite sheet.
 * Image: https://media.base44.com/images/public/6a0274360b010dce59336414/660c8a883_image.png
 *
 * Grid layout (6 columns × 3 rows, each cell ~190×190px in a 1140×570 image):
 * Row 0: INTJ, INTP, ENTJ, ENTP, INFJ, INFP
 * Row 1: ENFJ, INFP(dup→ISFJ), ENFJ(dup→ENFP), ISFJ, ESTJ, ESFJ
 * Row 2: ISTP, ISFP, ESTP, ESTP(dup→ESFP), ESFP(→ESFP), [beside logo]
 *
 * We map each MBTI to its best matching cell.
 */

const SPRITE = 'https://media.base44.com/images/public/6a0274360b010dce59336414/280d9c210_image.png';

// Grid: [col, row] — 0-indexed, 6 cols × 3 rows
const MBTI_CELL = {
  INTJ: [0, 0],
  INTP: [1, 0],
  ENTJ: [2, 0],
  ENTP: [3, 0],
  INFJ: [4, 0],
  INFP: [5, 0],
  ENFJ: [0, 1],
  ISFJ: [3, 1],  // row1 col3 = ISFJ Defender
  ESFJ: [5, 1],
  ESTJ: [4, 1],
  ISTP: [0, 2],
  ISFP: [1, 2],
  ESTP: [2, 2],
  ESFP: [3, 2],
  ENFP: [4, 2],
  ISTJ: [5, 2],
};

export const MBTI_AVATAR_GRADIENT = {
  ISTJ: 'from-[#4A7CB8] to-[#2d5588]',
  ISFJ: 'from-[#47a896] to-[#2d6f61]',
  INFJ: 'from-[#48b884] to-[#2a8f62]',
  INTJ: 'from-[#9b7bc9] to-[#6b4fa3]',
  ISTP: 'from-[#6b8caf] to-[#455f78]',
  ISFP: 'from-[#d4a853] to-[#b8893a]',
  INFP: 'from-[#d889c9] to-[#b05fa3]',
  INTP: 'from-[#8b86d9] to-[#5e56b8]',
  ESTP: 'from-[#e89454] to-[#d06328]',
  ESFP: 'from-[#e8bc42] to-[#d49818]',
  ENFP: 'from-[#e8d048] to-[#ccaa20]',
  ENTP: 'from-[#b887e8] to-[#8e54d4]',
  ESTJ: 'from-[#5a9bd4] to-[#3478b8]',
  ESFJ: 'from-[#52c4a8] to-[#2ea889]',
  ENFJ: 'from-[#52d494] to-[#28b068]',
  ENTJ: 'from-[#e87858] to-[#d44828]',
};

/**
 * Renders a circular avatar cropped from the MBTI sprite sheet.
 * sizeClass controls the rendered size (e.g. "w-11 h-11").
 * The sprite image is divided into a 6×3 grid; we show only the matching cell.
 */
export default function MbtiAvatar({ code, sizeClass = 'w-11 h-11', iconClass = '' }) {
  const cell = MBTI_CELL[code];
  const gradient = MBTI_AVATAR_GRADIENT[code] || 'from-primary to-primary/70';

  if (!cell) {
    // fallback: gradient circle
    return (
      <div
        className={`shrink-0 rounded-full bg-gradient-to-br ${gradient} ${sizeClass} flex items-center justify-center shadow-md ring-2 ring-white/25`}
        aria-hidden
      />
    );
  }

  const [col, row] = cell;
  const COLS = 6;
  const ROWS = 3;

  // background-position as percentage
  const posX = col === 0 ? 0 : (col / (COLS - 1)) * 100;
  const posY = row === 0 ? 0 : (row / (ROWS - 1)) * 100;

  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden shadow-md ring-2 ring-white/25 ${sizeClass}`}
      aria-hidden
      style={{
        backgroundImage: `url(${SPRITE})`,
        backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}