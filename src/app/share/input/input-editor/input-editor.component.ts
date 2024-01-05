import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.scss']
})
export class InputEditorComponent implements OnInit {
  // Link custom ckeditor: https://ckeditor.com/latest/samples/toolbarconfigurator/#basic
  // ckeConfig = {
  //   lang: 'en',
  //   extraPlugins: 'youtube,colorbutton,justify',
  //   removeButtons: 'Copy,Cut,Paste,Undo,Redo,Print,PasteText,PasteFromWord',
  //   height: '150px'
  // };
  ckeConfig = {
    //   // lang: 'en',
    //   // extraPlugins: 'colorbutton,justify',
    //   // removeButtons: 'Copy,Cut,Paste,Undo,Redo,Print,PasteText,PasteFromWord,NewPage',
    //   // height: '150px',
    //   // allowedContent: false,
    //   // forcePasteAsPlainText: true,
    //   // height: 150,
    //   // toolbar: [
    //   //   {
    //   //     name: 'document',
    //   //     groups: ['mode', 'document', 'doctools'],
    //   //     items: ['Source'],
    //   //   },
    //   //   { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
    //   //   { name: 'colors', items: ['TextColor', 'BGColor'] },
    //   //   {
    //   //     name: 'insert',
    //   //     items: ['Table', 'HorizontalRule', 'SpecialChar', 'PageBreak'],
    //   //   },
    //   //   {
    //   //     name: 'basicstyles',
    //   //     groups: ['basicstyles', 'cleanup'],
    //   //     items: [
    //   //       'Bold',
    //   //       'Italic',
    //   //       'Underline',
    //   //       'Strike',
    //   //       'Subscript',
    //   //       'Superscript',
    //   //       '-',
    //   //       'CopyFormatting',
    //   //       'RemoveFormat',
    //   //     ],
    //   //   },
    //   //   {
    //   //     name: 'paragraph',
    //   //     groups: ['list', 'indent', 'blocks', 'align', 'bidi'],
    //   //     items: [
    //   //       'NumberedList',
    //   //       'BulletedList',
    //   //       '-',
    //   //       'Outdent',
    //   //       'Indent',
    //   //       '-',
    //   //       'Blockquote',
    //   //       'CreateDiv',
    //   //       '-',
    //   //       'JustifyLeft',
    //   //       'JustifyCenter',
    //   //       'JustifyRight',
    //   //       'JustifyBlock',
    //   //       '-',
    //   //       'BidiLtr',
    //   //       'BidiRtl',
    //   //       'Language',
    //   //     ],
    //   //   },
    //   // ],
    allowedContent: false,
    extraPlugins: 'youtube,colorbutton,justify',
    forcePasteAsPlainText: true,
    height: 150,
    toolbarGroups: [
      { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
		{ name: 'forms', groups: [ 'forms' ] },
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
		{ name: 'links', groups: [ 'links' ] },
		{ name: 'insert', groups: [ 'insert' ] },
		{ name: 'styles', groups: [ 'styles' ] },
		{ name: 'colors', groups: [ 'colors' ] },
		{ name: 'tools', groups: [ 'tools' ] },
		{ name: 'others', groups: [ 'others' ] },
		{ name: 'youtube', groups: [ 'youtube' ] },
		{ name: 'about', groups: [ 'about' ] }
    ],
    removeButtons: 'Save,Templates,NewPage,Preview,Print,Cut,Redo,Copy,Paste,PasteText,PasteFromWord,Undo,Replace,Find,SelectAll,Scayt,Form,TextField,Textarea,Button,Select,HiddenField,ImageButton,CopyFormatting,RemoveFormat,Outdent,Indent,CreateDiv,Language,BidiRtl,BidiLtr,Anchor,Flash,Smiley,SpecialChar,PageBreak,Iframe,ShowBlocks'
  };
  @Input() content!: string;
  @Output() contentChange: EventEmitter<string> = new EventEmitter();
  // tslint:disable-next-line:no-output-native
  @Output() blur: EventEmitter<string> = new EventEmitter();
  timeOut: any;
  constructor() { }
  ngOnInit(): void { }
  onChangeContent() {
    this.contentChange.emit(this.content);
  }
  onBlur() {
    this.blur.emit(this.content);
  }

}
