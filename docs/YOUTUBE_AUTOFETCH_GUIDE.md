# 🎥 YouTube Auto-Fetch Guide

## 📋 Overview

StreamFlix dapat otomatis mengambil informasi dari YouTube termasuk:
- ✅ Thumbnail (gambar preview)
- ✅ Title (judul video)
- ✅ Description (deskripsi video)

---

## 🚀 Cara Menggunakan

### Method 1: Automatic (Recommended)

1. **Buka Upload Page**
   ```
   http://localhost:3000/upload
   ```

2. **Pilih Video Source Type**
   - Select: **"YouTube"**

3. **Paste YouTube URL**
   ```
   Contoh URL yang didukung:
   - https://www.youtube.com/watch?v=VIDEO_ID
   - https://youtu.be/VIDEO_ID
   - https://www.youtube.com/embed/VIDEO_ID
   ```

4. **Tunggu Auto-Fetch**
   - Sistem akan otomatis fetch data dalam 2-3 detik
   - Lihat "Debug Info" untuk status

5. **Verify Data**
   - ✅ Thumbnail preview muncul
   - ✅ Title terisi
   - ✅ Description terisi

### Method 2: Manual Fetch

Jika auto-fetch tidak bekerja:

1. **Paste YouTube URL**
2. **Click "Fetch Info" Button**
   - Button biru di sebelah URL input
3. **Data akan di-fetch ulang**

---

## 🔍 Debug Info

Saat upload YouTube video, akan muncul box biru dengan info:

```
Debug Info:
Video ID: dQw4w9WgXcQ
Thumbnail URL: https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg
Title: Rick Astley - Never Gonna Give You Up
Data Fetched: Yes
```

### Penjelasan:
- **Video ID**: ID unik YouTube video (11 karakter)
- **Thumbnail URL**: URL gambar thumbnail
- **Title**: Judul video dari YouTube
- **Data Fetched**: Status apakah data sudah di-fetch

---

## 🖼️ Thumbnail Quality

StreamFlix menggunakan kualitas tertinggi yang tersedia:

### Priority Order:
1. **maxresdefault.jpg** (1920x1080) - Highest quality
2. **hqdefault.jpg** (480x360) - Fallback if maxres not available

### URL Format:
```
Primary: https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg
Fallback: https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg
```

---

## 📝 Data Yang Di-Fetch

### 1. Thumbnail
```javascript
Source: YouTube CDN
Format: JPG
Quality: 1920x1080 (maxresdefault)
Fallback: 480x360 (hqdefault)
```

### 2. Title
```javascript
Source: YouTube oEmbed API
Example: "Rick Astley - Never Gonna Give You Up"
Max Length: 100 characters
```

### 3. Description
```javascript
Source: YouTube title (used as description)
Format: "Video from YouTube: [title]"
Example: "Rick Astley - Never Gonna Give You Up"
```

---

## 🔧 Troubleshooting

### Problem 1: Thumbnail Tidak Muncul

**Symptoms:**
- Thumbnail URL terisi tapi gambar tidak muncul
- Preview menunjukkan broken image

**Solutions:**

1. **Check Video ID**
   ```
   Pastikan Video ID terdeteksi dengan benar
   Lihat di Debug Info
   ```

2. **Try Manual Fetch**
   ```
   Click "Fetch Info" button
   ```

3. **Check Thumbnail URL**
   ```
   Copy thumbnail URL
   Paste di browser baru
   Verify gambar bisa dibuka
   ```

4. **Use Fallback**
   ```
   Jika maxresdefault tidak ada,
   sistem otomatis gunakan hqdefault
   ```

### Problem 2: Title/Description Kosong

**Symptoms:**
- Thumbnail muncul tapi title kosong
- Description tidak terisi

**Solutions:**

1. **Check YouTube oEmbed API**
   ```
   Open browser console (F12)
   Look for error messages
   ```

2. **Manual Input**
   ```
   Jika auto-fetch gagal,
   input manual title dan description
   ```

3. **Try Different URL Format**
   ```
   From: https://youtu.be/VIDEO_ID
   To: https://www.youtube.com/watch?v=VIDEO_ID
   ```

### Problem 3: Data Fetched = No

**Symptoms:**
- Debug Info shows "Data Fetched: No"
- No data auto-filled

**Solutions:**

1. **Wait Longer**
   ```
   Tunggu 3-5 detik setelah paste URL
   ```

2. **Click Fetch Info**
   ```
   Manual trigger fetch dengan button
   ```

3. **Check Internet Connection**
   ```
   Pastikan koneksi internet stabil
   ```

4. **Check CORS**
   ```
   YouTube oEmbed API harus accessible
   ```

---

## 🎯 Best Practices

### 1. URL Format
```
✅ GOOD:
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ

❌ BAD:
youtube.com/watch?v=dQw4w9WgXcQ (missing https://)
www.youtube.com/watch?v=dQw4w9WgXcQ (missing https://)
```

### 2. Timing
```
1. Paste URL
2. Wait 2-3 seconds
3. Verify data in Debug Info
4. Check thumbnail preview
5. Proceed with upload
```

### 3. Verification
```
Before uploading, verify:
✅ Thumbnail preview shows
✅ Title is filled
✅ Description is filled
✅ Debug Info shows "Data Fetched: Yes"
```

---

## 📊 Technical Details

### YouTube oEmbed API

**Endpoint:**
```
https://www.youtube.com/oembed?url=VIDEO_URL&format=json
```

**Response:**
```json
{
  "title": "Video Title",
  "author_name": "Channel Name",
  "thumbnail_url": "https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg",
  "thumbnail_width": 480,
  "thumbnail_height": 360
}
```

**No API Key Required:**
- Free to use
- No rate limits for basic usage
- Public endpoint

### Thumbnail CDN

**Base URL:**
```
https://i.ytimg.com/vi/VIDEO_ID/
```

**Available Qualities:**
```
maxresdefault.jpg - 1920x1080 (best)
sddefault.jpg     - 640x480
hqdefault.jpg     - 480x360
mqdefault.jpg     - 320x180
default.jpg       - 120x90 (worst)
```

---

## 🔄 Flow Diagram

```
User Action:
1. Select "YouTube" as video type
2. Paste YouTube URL
   ↓
System Action:
3. Extract Video ID from URL
4. Generate thumbnail URL
5. Call YouTube oEmbed API
6. Parse response
7. Update form fields
   ↓
User Verification:
8. Check Debug Info
9. Verify thumbnail preview
10. Verify title/description
11. Upload video
```

---

## 💡 Tips & Tricks

### Tip 1: Quick Test
```
Use this test URL:
https://www.youtube.com/watch?v=dQw4w9WgXcQ

Should auto-fill:
- Title: "Rick Astley - Never Gonna Give You Up"
- Thumbnail: High quality image
```

### Tip 2: Manual Override
```
Jika tidak suka auto-filled data:
1. Clear title/description
2. Input manual
3. Thumbnail tetap dari YouTube
```

### Tip 3: Batch Upload
```
Untuk upload banyak video:
1. Prepare list of YouTube URLs
2. Paste one by one
3. Wait for auto-fetch
4. Upload
5. Repeat
```

---

## 🐛 Known Issues

### Issue 1: CORS Error
**Status:** Rare
**Impact:** oEmbed API call fails
**Workaround:** Use manual input

### Issue 2: Maxres Not Available
**Status:** Common for old videos
**Impact:** Falls back to hqdefault
**Workaround:** None needed (automatic)

### Issue 3: Slow Fetch
**Status:** Depends on internet speed
**Impact:** Takes longer than 3 seconds
**Workaround:** Wait or use manual fetch button

---

## 📞 Support

### Need Help?

1. **Check Debug Info**
   - Look for error messages
   - Verify Video ID detected

2. **Check Browser Console**
   - Press F12
   - Look for errors in Console tab

3. **Try Manual Fetch**
   - Use "Fetch Info" button

4. **Report Issue**
   - Include Video URL
   - Include Debug Info
   - Include Console errors

---

## ✅ Success Checklist

Before uploading, verify:

- [ ] Video Source Type = "YouTube"
- [ ] YouTube URL pasted
- [ ] Video ID detected (11 characters)
- [ ] Thumbnail URL generated
- [ ] Thumbnail preview shows
- [ ] Title filled
- [ ] Description filled
- [ ] Debug Info shows "Data Fetched: Yes"
- [ ] All other fields filled
- [ ] Ready to upload!

---

**Happy Uploading! 🎬**

**Last Updated**: March 7, 2024
**Version**: 1.1.1
