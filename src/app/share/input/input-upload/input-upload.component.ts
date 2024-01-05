import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { StorageService } from 'src/app/services/api/storage.service';
import { ObjectAny } from 'src/app/types/viewmodels';

@Component({
  selector: 'app-input-upload',
  templateUrl: './input-upload.component.html',
  styleUrls: ['./input-upload.component.scss'],
})
export class InputUploadComponent implements OnInit {
  @ViewChild('audio') audio: any;

  @Input() placeholder = 'URL or upload image ...';
  @Input() type: 'audio' | 'image' = 'image';
  @Input() bodyUpload: ObjectAny = {};
  @Input() width!: number;
  @Input() height!: number;
  @Input() inputClass: string = '';
  @Input() url: string = '';
  @Output() urlChange: EventEmitter<string> = new EventEmitter();

  loading: boolean = false;
  statusAudio = 'end';
  constructor(
    private storageService: StorageService,
    private toastr: ToastrService) { }

  ngOnInit(): void { }
  onChange(event: any) {
    this.urlChange.emit(event);
  }
  uploadFile() {
    let accept: 'image/x-png,image/gif,image/jpeg,image/x-icon' | 'audio/mp3' =
      'audio/mp3';
    if (this.type === 'image') {
      // if (this.width) query.width = this.width
      // if (this.height) query.height = this.height
      accept = 'image/x-png,image/gif,image/jpeg,image/x-icon';
    }
    this.loading = true
    this.storageService.attach(accept, 2, this.bodyUpload).subscribe({
      next: (res) => {
        if (res.data?.length) {
          this.url = res.data[0];
          this.urlChange.emit(this.url);
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.warning(err);
      }
    });
  }
  startAudio() {
    if (['end', 'pause'].includes(this.statusAudio)) {
      this.statusAudio = 'start';
      this.audio.nativeElement.play();
      this.audio.nativeElement.onended = () => {
        this.statusAudio = 'end';
      };
    } else if (this.statusAudio === 'start') {
      this.statusAudio = 'pause';
      this.audio.nativeElement.pause();
    }
  }
}
