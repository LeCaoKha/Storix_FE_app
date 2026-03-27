export const getBottomSafePadding = (bottomInset: number, basePadding = 16) => {
    return basePadding + Math.max(bottomInset, 0);
};

export const getTopSafePadding = (topInset: number, basePadding = 12) => {
    return Math.max(topInset, 0) + basePadding;
};