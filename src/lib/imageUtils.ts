/**
 * Redimensiona uma imagem para as dimensões especificadas mantendo a qualidade
 * @param file - Arquivo de imagem original
 * @param targetWidth - Largura alvo em pixels
 * @param targetHeight - Altura alvo em pixels
 * @returns Promise com o Blob da imagem redimensionada
 */
export const resizeImage = (
  file: File,
  targetWidth: number,
  targetHeight: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }
        
        // Calcular proporções para crop centralizado
        const sourceAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;
        
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;
        
        if (sourceAspect > targetAspect) {
          // Imagem mais larga - crop nas laterais
          sourceWidth = img.height * targetAspect;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Imagem mais alta - crop em cima/baixo
          sourceHeight = img.width / targetAspect;
          sourceY = (img.height - sourceHeight) / 2;
        }
        
        // Desenhar imagem redimensionada
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, targetWidth, targetHeight
        );
        
        // Converter para blob com qualidade alta
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao converter canvas para blob'));
            }
          },
          'image/jpeg',
          0.92
        );
      };
      
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Valida se o arquivo é uma imagem válida
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Formato inválido. Use PNG, JPG ou WEBP.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 2MB.' };
  }
  
  return { valid: true };
};
