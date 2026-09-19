export interface PhotoAlbum {
  id: string;
  familyId: string;
  creatorId: string;
  title: string;
  description?: string;
  coverPhotoUrl?: string;
  createdAt?: string;
}

export interface PhotoAlbumEntry {
  album: PhotoAlbum;
  creator?: { id?: string; fullName?: string; avatarUrl?: string } | null;
  photoCount: number;
  coverPhoto?: string | null;
}

export interface PhotoAlbumListResponse {
  albums: PhotoAlbumEntry[];
}

export interface CreateAlbumRequest {
  familyId: string;
  title: string;
  description?: string;
  coverPhotoUrl?: string;
}

export interface AlbumMemberSummary {
  id: string;
  fullName: string;
}

export interface Photo {
  id: string;
  albumId: string;
  uploaderId?: string;
  photoUrl: string;
  caption?: string;
  photoDate?: string;
  photoLocation?: string;
  memberIds?: string[];
  createdAt?: string;
}

export interface PhotoEntry {
  photo: Photo;
  uploader?: { id?: string; fullName?: string; avatarUrl?: string } | null;
  taggedMembers: AlbumMemberSummary[];
}

export interface PhotoListResponse {
  photos: PhotoEntry[];
}

export interface AddPhotoRequest {
  photoUrl: string;
  caption?: string;
  photoDate?: string;
  photoLocation?: string;
  memberIds?: string[];
}