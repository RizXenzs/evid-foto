import type { Photo } from '@/types'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Applies an EvidFoto watermark to a photo using Canvas API.
 * Returns a Blob of the watermarked image (JPEG).
 */
export async function applyWatermark(photo: Photo): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Fetch the original image as a blob and create an object URL
      const response = await fetch(photo.file_url)
      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)

      // 2. Load image element
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // 3. Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!

        // 4. Draw original image
        ctx.drawImage(img, 0, 0)

        // 5. Calculate dimensions based on image size
        const scale = Math.min(img.naturalWidth / 1200, img.naturalHeight / 900, 1)
        const padding = Math.max(16 * scale, 10)
        const baseFontSize = Math.max(18 * scale, 11)
        const smallFontSize = Math.max(14 * scale, 9)
        const lineHeight = baseFontSize * 1.55

        // 6. Prepare watermark text
        const uploaderName = photo.uploader?.full_name || photo.uploader?.email || 'EvidFoto User'
        const uploadDateStr = (() => {
          try {
            return format(new Date(photo.upload_date), "dd MMM yyyy '|' HH:mm 'WIB'", { locale: id })
          } catch {
            return photo.upload_date
          }
        })()
        const locationStr = photo.location || ''

        // 7. Calculate watermark banner height
        const lines = [uploaderName, uploadDateStr, ...(locationStr ? [locationStr] : [])]
        const bannerHeight = padding + (lines.length * lineHeight) + baseFontSize + padding * 1.5

        // 8. Draw top-left banner (EvidFoto logo area)
        const topBannerHeight = baseFontSize + padding * 2.2
        ctx.fillStyle = 'rgba(0, 0, 0, 0.62)'
        ctx.fillRect(0, 0, img.naturalWidth * 0.38, topBannerHeight)

        // 9. Draw EvidFoto logo text (top-left)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${baseFontSize}px "Segoe UI", Arial, sans-serif`
        ctx.fillText('📷 EvidFoto', padding, padding + baseFontSize * 0.85)

        // 10. Draw bottom-left info banner
        const bannerY = img.naturalHeight - bannerHeight
        ctx.fillStyle = 'rgba(0, 0, 0, 0.62)'
        ctx.fillRect(0, bannerY, img.naturalWidth * 0.72, bannerHeight)

        // 11. Horizontal separator line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
        ctx.lineWidth = Math.max(1 * scale, 0.5)
        ctx.beginPath()
        ctx.moveTo(padding, bannerY + padding * 0.6)
        ctx.lineTo(img.naturalWidth * 0.68, bannerY + padding * 0.6)
        ctx.stroke()

        // 12. Draw uploader name (bottom-left, largest)
        let textY = bannerY + padding + baseFontSize
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${baseFontSize}px "Segoe UI", Arial, sans-serif`
        ctx.fillText(`👤 ${uploaderName}`, padding, textY)

        // 13. Draw date & time
        textY += lineHeight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.font = `${smallFontSize}px "Segoe UI", Arial, sans-serif`
        ctx.fillText(`🕐 ${uploadDateStr}`, padding, textY)

        // 14. Draw location if available
        if (locationStr) {
          textY += lineHeight * 0.9
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
          ctx.font = `${smallFontSize}px "Segoe UI", Arial, sans-serif`
          ctx.fillText(`📍 ${locationStr}`, padding, textY)
        }

        // 15. Export as blob
        canvas.toBlob(
          (resultBlob) => {
            URL.revokeObjectURL(imageUrl)
            if (resultBlob) {
              resolve(resultBlob)
            } else {
              reject(new Error('Canvas toBlob gagal'))
            }
          },
          'image/jpeg',
          0.92
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl)
        reject(new Error('Gagal load gambar untuk watermark'))
      }

      img.src = imageUrl
    } catch (err) {
      reject(err)
    }
  })
}
