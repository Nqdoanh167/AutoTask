import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ILead, ILeadComment, ELeadCommentContentType, ILeadCommentHistory } from '@app/types/lead';
import { StorageService } from '@app/services/api/storage.service';
import { AutoTaskService } from '@app/services/api/autoTask.service';
import { ToastrService } from 'ngx-toastr';
import { finalize, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

export interface IComment {
  id: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    picture: string;
  };
  content: string;
  contentType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-lead-comments-sidebar',
  templateUrl: './lead-comments-sidebar.component.html',
  styleUrls: ['./lead-comments-sidebar.component.scss'],
})
export class LeadCommentsSidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() lead?: ILead;
  @Output() close = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  comments: IComment[] = [];
  newCommentText = '';
  isSubmitting = false;
  isClosing = false;
  isUploading = false;
  isLoadingComments = false;
  selectedFiles: File[] = [];
  selectedImages: File[] = [];
  textareaHeight = 'auto';
  destroy$ = new Subject<void>();

  constructor(
    private storageService: StorageService,
    private autoTaskService: AutoTaskService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load comments from API
   */
  loadComments(): void {
    if (!this.lead?.id) return;

    this.isLoadingComments = true;
    this.autoTaskService.leadComment.get({
      leadId: this.lead.id,
      sort: 'createdAt' // Sort by createdAt ascending
    })
    .pipe(
      finalize(() => this.isLoadingComments = false),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (response) => {
        if (response?.data) {
          this.comments = response.data.map(history => this.mapCommentHistoryToComment(history));
        }
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.toastr.error('Có lỗi xảy ra khi tải bình luận');
      }
    });
  }

  /**
   * Map ILeadCommentHistory to IComment interface
   */
  private mapCommentHistoryToComment(history: ILeadCommentHistory): IComment {
    return {
      id: history.id,
      createdBy: history.createdBy,
      content: history.content || '',
      contentType: this.mapContentType(history.contentType),
      imageUrl: history.imageUrl,
      videoUrl: history.videoUrl,
      audioUrl: history.audioUrl,
      fileUrl: history.fileUrl,
      fileName: history.fileName,
      fileType: history.fileType,
      createdAt: new Date(history.createdAt),
      updatedAt: new Date(history.updatedAt),
    };
  }

  /**
   * Map ELeadCommentContentType to IComment contentType
   */
  private mapContentType(contentType: ELeadCommentContentType): 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO' {
    switch (contentType) {
      case ELeadCommentContentType.IMAGE:
        return 'IMAGE';
      case ELeadCommentContentType.FILE:
        return 'FILE';
      case ELeadCommentContentType.VIDEO:
        return 'VIDEO';
      case ELeadCommentContentType.AUDIO:
        return 'AUDIO';
      default:
        return 'TEXT';
    }
  }

  /**
   * Load mock comments data based on image
   */
  loadMockComments(): void {
    this.comments = [
      {
        id: '1',
        createdBy: {
          id: 'user-1',
          name: 'Nguyễn Tú',
          email: 'tu.nguyen@example.com',
          picture: 'assets/images/avatar.svg',
        },
        content: 'Đã gửi 1 ảnh',
        contentType: 'IMAGE',
        imageUrl: 'https://via.placeholder.com/600x400/4CAF50/FFFFFF?text=Sample+Image',
        createdAt: new Date('2024-09-09T15:06:00'),
        updatedAt: new Date('2024-09-09T15:06:00'),
      },
      {
        id: '2',
        createdBy: {
          id: 'user-1',
          name: 'Nguyễn Tú',
          email: 'tu.nguyen@example.com',
          picture: 'assets/images/avatar.svg',
        },
        content: 'Đã gửi File đính kèm',
        contentType: 'FILE',
        fileUrl: '#',
        fileName: 'Danh_sach_khach_hang.xlsx',
        fileType: 'excel',
        createdAt: new Date('2024-09-09T15:06:00'),
        updatedAt: new Date('2024-09-09T15:06:00'),
      },
      {
        id: '3',
        createdBy: {
          id: 'user-2',
          name: 'Nguyễn Hương Quỳnh',
          email: 'quynh.nguyen@example.com',
          picture: 'assets/images/avatar.svg',
        },
        content: 'Đã chốt xong, khách mua gói nền tảng',
        contentType: 'TEXT',
        createdAt: new Date('2024-09-09T15:06:00'),
        updatedAt: new Date('2024-09-09T15:06:00'),
      },
      {
        id: '4',
        createdBy: {
          id: 'user-3',
          name: 'Nguyễn Mạnh Cường',
          email: 'cuong.nguyen@example.com',
          picture: 'assets/images/avatar.svg',
        },
        content: 'Đã nhận khách mới sự kiện',
        contentType: 'TEXT',
        createdAt: new Date('2024-09-09T15:06:00'),
        updatedAt: new Date('2024-09-09T15:06:00'),
      },
    ];
  }

  /**
   * Close sidebar with animation
   */
  onClose(): void {
    // Trigger closing animation
    this.isClosing = true;
    
    // Wait for animation to complete before emitting close event
    setTimeout(() => {
      this.isClosing = false;
      this.close.emit();
    }, 300); // Match animation duration in CSS
  }

  /**
   * Handle send new comment
   */
  onSendComment(): void {
    if ((!this.newCommentText.trim() && !this.selectedFiles.length && !this.selectedImages.length) || !this.lead?.id) {
      return;
    }

    this.isSubmitting = true;

    // If only text comment
    if (this.newCommentText.trim() && !this.selectedFiles.length && !this.selectedImages.length) {
      this.sendTextComment();
      return;
    }

    // If has attachments, upload them first
    const allFiles = [...this.selectedFiles, ...this.selectedImages];
    if (allFiles.length > 0) {
      this.uploadAndSendComments(allFiles);
    } else {
      this.sendTextComment();
    }
  }

  /**
   * Send text-only comment
   */
  private sendTextComment(): void {
    const commentData = {
      leadId: this.lead!.id,
      content: this.newCommentText.trim(),
      contentType: ELeadCommentContentType.TEXT,
    };

    this.autoTaskService.leadComment.create(commentData)
      .pipe(
        finalize(() => this.isSubmitting = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response?.data) {
            const newComment = this.mapCommentHistoryToComment(response.data);
            this.comments.push(newComment);

            // Clear input
            this.clearInput();

            // Scroll to bottom after adding comment
            setTimeout(() => {
              this.scrollToBottom();
            }, 100);
          }
        },
        error: (error) => {
          console.error('Error creating comment:', error);
          this.toastr.error('Có lỗi xảy ra khi gửi bình luận');
        }
      });
  }

  /**
   * Upload files and create comments
   */
  private uploadAndSendComments(files: File[]): void {
    this.storageService.uploadFiles(files)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response) => {
          if (response?.data && response.data.length > 0) {
            let uploadedCount = 0;
            const totalFiles = files.length;
            const hasText = this.newCommentText.trim();

            response.data.forEach((fileUrl, index) => {
              const file = files[index];
              const isImage = this.selectedImages.includes(file);

              const commentData: any = {
                leadId: this.lead!.id,
                content: hasText ? this.newCommentText.trim() : (isImage ? `Đã gửi 1 ảnh: ${file.name}` : `Đã gửi file đính kèm: ${file.name}`),
                contentType: isImage ? ELeadCommentContentType.IMAGE : ELeadCommentContentType.FILE,
              };

              // Set appropriate URL based on content type
              if (isImage) {
                commentData.imageUrl = fileUrl;
              } else {
                commentData.fileUrl = fileUrl;
                commentData.fileName = file.name;
                commentData.fileType = this.getFileType(file.name);
              }

              this.autoTaskService.leadComment.create(commentData)
                .subscribe({
                  next: (commentResponse) => {
                    if (commentResponse?.data) {
                      const newComment = this.mapCommentHistoryToComment(commentResponse.data);
                      this.comments.push(newComment);
                      uploadedCount++;

                      // Clear input after all comments are created
                      if (uploadedCount === totalFiles) {
                        this.clearInput();
                        setTimeout(() => {
                          this.scrollToBottom();
                        }, 100);
                      }
                    }
                  },
                  error: (error) => {
                    console.error('Error creating file comment:', error);
                    uploadedCount++;
                    if (uploadedCount === totalFiles) {
                      this.clearInput();
                      this.toastr.warning('Một số file không thể tạo bình luận');
                    }
                  }
                });
            });

            this.toastr.success(`Đã tải lên ${files.length} file thành công`);
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.toastr.error('Có lỗi xảy ra khi tải lên file');
        }
      });
  }

  /**
   * Clear input and selected files
   */
  private clearInput(): void {
    this.newCommentText = '';
    this.selectedFiles = [];
    this.selectedImages = [];
    this.adjustTextareaHeight();
  }

  /**
   * Scroll comments container to bottom
   */
  scrollToBottom(): void {
    const commentsContainer = document.querySelector('.comments-list');
    if (commentsContainer) {
      commentsContainer.scrollTop = commentsContainer.scrollHeight;
    }
  }

  /**
   * Format date to display
   */
  formatDate(date: Date): string {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Format: HH:mm DD/MM/YYYY
    const hours = commentDate.getHours().toString().padStart(2, '0');
    const minutes = commentDate.getMinutes().toString().padStart(2, '0');
    const day = commentDate.getDate().toString().padStart(2, '0');
    const month = (commentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = commentDate.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  }

  /**
   * Handle attach file
   */
  onAttachFile(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handle file selection for files
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    if (this.selectedFiles.length + files.length > 3) {
      this.toastr.warning('Chỉ được chọn tối đa 3 file');
      return;
    }

    // Check file size (10MB each)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      this.toastr.warning('Mỗi file không được vượt quá 10MB');
      return;
    }

    // Add to selected files
    this.selectedFiles = [...this.selectedFiles, ...files];

    // Clear input
    input.value = '';
  }

  /**
   * Handle attach image
   */
  onAttachImage(): void {
    this.imageInput.nativeElement.click();
  }

  /**
   * Handle file selection for images
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    // Filter for image files only
    const imageFiles = files.filter(file =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      this.toastr.warning('Vui lòng chọn file hình ảnh');
      return;
    }

    if (this.selectedImages.length + imageFiles.length > 5) {
      this.toastr.warning('Chỉ được chọn tối đa 5 hình ảnh');
      return;
    }

    // Check file size (5MB each)
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      this.toastr.warning('Mỗi hình ảnh không được vượt quá 5MB');
      return;
    }

    // Add to selected images
    this.selectedImages = [...this.selectedImages, ...imageFiles];

    // Clear input
    input.value = '';
  }


  /**
   * Format file size to human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Remove selected file
   */
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /**
   * Remove selected image
   */
  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }

  /**
   * Adjust textarea height based on content
   */
  adjustTextareaHeight(): void {
    const textarea = document.querySelector('.comment-input-area textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      this.textareaHeight = textarea.style.height;
    }
  }

  /**
   * Get file type from filename
   */
  private getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Handle download file
   */
  onDownloadFile(comment: IComment): void {
    if (comment.fileUrl) {
      // TODO: Implement file download
    }
  }

  /**
   * Handle view image
   */
  onViewImage(comment: IComment): void {
    if (comment.imageUrl) {
      // TODO: Implement image viewer
    }
  }
}
