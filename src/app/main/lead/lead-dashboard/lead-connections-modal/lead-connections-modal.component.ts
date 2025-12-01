import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { IPlatform, IConnection } from '../lead-form-modal/lead-form-modal.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-lead-connections-modal',
  templateUrl: './lead-connections-modal.component.html',
  styleUrls: ['./lead-connections-modal.component.scss'],
})
export class LeadConnectionsModalComponent implements OnInit {
  @Output() saveEvent = new EventEmitter<IPlatform[]>();

  public platforms: IPlatform[] = [];
  public isSubmitting = false;
  public isAddingConnection = false;
  public editingConnectionIndex: { platformIndex: number; connectionIndex: number } | null = null;
  public addingPlatformType: string | null = null;
  
  public connectionForm!: FormGroup;
  public availablePlatforms = [
    { value: 'FACEBOOK', name: 'Facebook', icon: 'fa-brands fa-facebook' },
    { value: 'ZALO_PERSONAL', name: 'Zalo Cá Nhân', icon: 'fa-brands fa-zalo' },
    { value: 'ZALO_OA', name: 'Zalo OA', icon: 'fa-brands fa-zalo' },
  ];

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
  ) {
    this.initConnectionForm();
  }

  ngOnInit(): void {
    // Initialize with existing platforms if passed from parent
    if ((this.bsModalRef.content as any)?.platforms) {
      this.platforms = JSON.parse(JSON.stringify((this.bsModalRef.content as any).platforms));
    }
  }

  initConnectionForm(): void {
    this.connectionForm = this.fb.group({
      platform: ['', [Validators.required]], // Platform selection
      platformId: ['', [Validators.required]],
      customerId: ['', [Validators.required]],
      customerName: [''],
      isInterested: [false],
    });
  }

  getPlatformIcon(platform: string): string {
    const platformConfig = this.availablePlatforms.find(p => p.value === platform);
    return platformConfig?.icon || 'fa-link';
  }

  getPlatformName(platform: string): string {
    const platformConfig = this.availablePlatforms.find(p => p.value === platform);
    return platformConfig?.name || platform;
  }

  openAddConnectionModal(platformIndex?: number): void {
    this.isAddingConnection = true;
    this.editingConnectionIndex = null;
    
    if (platformIndex !== undefined) {
      // Adding to existing platform
      this.addingPlatformType = this.platforms[platformIndex].platform;
      this.connectionForm.reset({
        platform: this.platforms[platformIndex].platform,
        platformId: '',
        customerId: '',
        customerName: '',
        isInterested: false,
      });
    } else {
      // Adding new - no platform selected yet
      this.addingPlatformType = null;
      this.connectionForm.reset({
        platform: '',
        platformId: '',
        customerId: '',
        customerName: '',
        isInterested: false,
      });
    }
  }

  openEditConnectionModal(platformIndex: number, connectionIndex: number): void {
    const connection = this.platforms[platformIndex].connections[connectionIndex];
    this.editingConnectionIndex = { platformIndex, connectionIndex };
    this.addingPlatformType = this.platforms[platformIndex].platform;
    this.connectionForm.patchValue({
      platform: this.platforms[platformIndex].platform,
      platformId: connection.platformId,
      customerId: connection.customerId,
      customerName: connection.customerName || '',
      isInterested: connection.isInterested || false,
    });
    this.isAddingConnection = true;
  }

  closeConnectionForm(): void {
    this.isAddingConnection = false;
    this.editingConnectionIndex = null;
    this.addingPlatformType = null;
    this.connectionForm.reset({
      platform: '',
      platformId: '',
      customerId: '',
      customerName: '',
      isInterested: false,
    });
  }

  saveConnection(): void {
    if (this.connectionForm.invalid) {
      this.connectionForm.markAllAsTouched();
      return;
    }

    const formValue = this.connectionForm.value;
    const platformValue = formValue.platform;
    
    if (!platformValue) {
      return;
    }

    const newConnection: IConnection = {
      platformId: formValue.platformId,
      customerId: formValue.customerId,
      customerName: formValue.customerName || undefined,
      isInterested: formValue.isInterested || false,
    };

    if (this.editingConnectionIndex) {
      // Edit existing connection
      const { platformIndex, connectionIndex } = this.editingConnectionIndex;
      this.platforms[platformIndex].connections[connectionIndex] = newConnection;
    } else {
      // Add new connection - check if platform exists
      let platformIndex = this.platforms.findIndex(p => p.platform === platformValue);
      
      if (platformIndex === -1) {
        // Platform doesn't exist, create it
        this.addPlatform(platformValue);
        platformIndex = this.platforms.length - 1;
      }
      
      // Add connection to platform
      this.platforms[platformIndex].connections.push(newConnection);
    }

    this.closeConnectionForm();
  }

  deleteConnection(platformIndex: number, connectionIndex: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa kết nối này?')) {
      this.platforms[platformIndex].connections.splice(connectionIndex, 1);
      // Remove platform if no connections left
      if (this.platforms[platformIndex].connections.length === 0) {
        this.platforms.splice(platformIndex, 1);
      }
    }
  }

  handleAddNewClick(): void {
    // Open modal to add new connection (with platform selection)
    this.openAddConnectionModal();
  }

  getAvailablePlatformsForSelect(): any[] {
    return this.availablePlatforms;
  }

  onPlatformChange(): void {
    // When platform is selected, update addingPlatformType for conditional fields
    const platformValue = this.connectionForm.get('platform')?.value;
    this.addingPlatformType = platformValue;
  }

  addPlatform(platformType: string): void {
    const platformConfig = this.availablePlatforms.find(p => p.value === platformType);
    if (!platformConfig) return;

    const newPlatform: IPlatform = {
      platform: platformType,
      platformName: platformConfig.name,
      platformIcon: platformConfig.icon,
      connections: [],
    };
    this.platforms.push(newPlatform);
  }

  onSubmit(): void {
    this.isSubmitting = true;
    this.saveEvent.emit(this.platforms);
    this.bsModalRef.hide();
  }

  onCancel(): void {
    this.bsModalRef.hide();
  }

  isZaloOA(platform: string): boolean {
    return platform === 'ZALO_OA';
  }
}
