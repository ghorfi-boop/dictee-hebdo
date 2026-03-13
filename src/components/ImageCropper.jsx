import { useState, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

function centerAspectCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    makeAspectCrop(
      { unit: '%', width: 80 },
      undefined, // no fixed aspect ratio
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export default function ImageCropper({ imageSrc, onAnalyzeCrop, onAnalyzeFull, onCancel }) {
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const imgRef = useRef(null)

  function onImageLoad(e) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height))
  }

  async function getCroppedBlob() {
    const image = imgRef.current
    if (!image || !completedCrop) return null

    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })
  }

  async function handleAnalyzeCrop() {
    const blob = await getCroppedBlob()
    if (!blob) {
      onAnalyzeFull()
      return
    }
    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
    onAnalyzeCrop(file)
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        marginBottom: 12,
        padding: '12px 16px',
        background: '#EEF2FF',
        borderRadius: 12,
        fontSize: 13,
        color: 'var(--primary)',
        fontWeight: 600,
      }}>
        ✂️ Ajuste le cadre sur la liste de mots, puis clique "Analyser cette zone"
      </div>

      <div style={{
        width: '100%',
        maxHeight: '60vh',
        overflow: 'auto',
        borderRadius: 12,
        border: '2px solid var(--border)',
        marginBottom: 16,
        background: '#f8f8f8',
      }}>
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          style={{ width: '100%' }}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="À analyser"
            onLoad={onImageLoad}
            style={{ width: '100%', display: 'block' }}
          />
        </ReactCrop>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="btn btn-primary btn-full"
          onClick={handleAnalyzeCrop}
          disabled={!completedCrop}
        >
          🔍 Analyser cette zone
        </button>
        <button
          className="btn btn-secondary btn-full"
          onClick={onAnalyzeFull}
        >
          🖼️ Analyser l'image entière
        </button>
        <button
          className="btn btn-ghost btn-full"
          onClick={onCancel}
        >
          ✕ Annuler
        </button>
      </div>
    </div>
  )
}
