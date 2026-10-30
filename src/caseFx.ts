/** Where the next case-study window should open from (iris origin) and which element it should fly out of. */
export const caseFx: { x: number; y: number; from: DOMRect | null } = {
  x: typeof innerWidth === 'undefined' ? 0 : innerWidth / 2,
  y: typeof innerHeight === 'undefined' ? 0 : innerHeight / 2,
  from: null,
}
