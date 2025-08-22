export const generateGuestSlug = (name: string, id: string): string => {
  const nameSlug = name
    .toLowerCase()
    .normalize("NFD") // Separate accent from letter
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/đ/g, "d") // Handle Vietnamese 'đ'
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
  
  const idSlug = id.toLowerCase();

  return `${nameSlug}-${idSlug}`;
};