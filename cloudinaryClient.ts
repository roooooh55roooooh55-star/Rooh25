
import { Video } from './types';

const CLOUD_NAME = 'dlrvn33p0'.trim();
const COMMON_TAG = 'hadiqa_v4';

/**
 * فيديوهات احتياطية مدمجة تضمن عمل التطبيق فوراً
 * وتمنع ظهور الشاشة السوداء حتى لو فشل الاتصال بـ Cloudinary
 */
const FALLBACK_VIDEOS: Video[] = [
  {
    id: 'fallback_1',
    public_id: 'fallback_1',
    video_url: 'https://res.cloudinary.com/dlrvn33p0/video/upload/q_auto,f_auto/v1/app_videos/scary_1.mp4',
    poster_url: 'https://res.cloudinary.com/dlrvn33p0/video/upload/q_auto,f_auto,so_0/v1/app_videos/scary_1.jpg',
    type: 'short',
    title: 'كابوس الحديقة المنسي',
    category: 'رعب الحديقة ⚠️',
    likes: 850, views: 12000, tags: ['supernatural', 'haunted']
  },
  {
    id: 'fallback_2',
    public_id: 'fallback_2',
    video_url: 'https://res.cloudinary.com/dlrvn33p0/video/upload/q_auto,f_auto/v1/app_videos/scary_2.mp4',
    poster_url: 'https://res.cloudinary.com/dlrvn33p0/video/upload/q_auto,f_auto,so_0/v1/app_videos/scary_2.jpg',
    type: 'long',
    title: 'مغامرة ليلية مرعبة',
    category: 'أخطر المشاهد 🔱',
    likes: 2100, views: 45000, tags: ['ghost', 'haunted']
  }
];

export const fetchCloudinaryVideos = async (): Promise<Video[]> => {
  try {
    const timestamp = new Date().getTime();
    const targetUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/list/${COMMON_TAG}.json?t=${timestamp}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store' 
    }).catch(() => null);

    if (!response || !response.ok) {
      console.warn("Cloudinary fetch blocked or failed. Using cache/fallback.");
      const cached = localStorage.getItem('app_videos_cache');
      return cached ? JSON.parse(cached) : FALLBACK_VIDEOS;
    }

    const data = await response.json();
    const resources = data.resources || [];
    
    if (resources.length === 0) return FALLBACK_VIDEOS;

    const mapped = resources.map((res: any) => {
      const videoType: 'short' | 'long' = (res.height > res.width) ? 'short' : 'long';
      const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload`;
      const optimizedUrl = `${baseUrl}/q_auto,f_auto/v${res.version}/${res.public_id}.${res.format}`;
      const posterUrl = `${baseUrl}/q_auto,f_auto,so_0/v${res.version}/${res.public_id}.jpg`;
      const title = res.context?.custom?.caption || 'فيديو مرعب';
      const categoryTag = res.context?.custom?.caption || 'غموض';

      return {
        id: res.public_id,
        public_id: res.public_id,
        video_url: optimizedUrl,
        poster_url: posterUrl,
        type: videoType,
        title: title,
        likes: 0,
        views: 0,
        category: categoryTag,
        created_at: res.created_at,
        tags: []
      } as Video;
    });

    localStorage.setItem('app_videos_cache', JSON.stringify(mapped));
    return mapped;
  } catch (error) {
    console.error("Critical error in fetchCloudinaryVideos:", error);
    const cached = localStorage.getItem('app_videos_cache');
    return cached ? JSON.parse(cached) : FALLBACK_VIDEOS;
  }
};
