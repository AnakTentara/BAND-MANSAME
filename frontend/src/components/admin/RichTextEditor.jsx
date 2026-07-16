import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { uploadBlogImage } from '@/api/admin';
import { getUploadUrl } from '@/api/axios';
import toast from 'react-hot-toast';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2
} from 'lucide-react';
import styles from './RichTextEditor.module.css';

export default function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Heading configuration
        heading: {
          levels: [2, 3]
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: styles.editorLink
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: styles.editorImage
        }
      }),
      Placeholder.configure({
        placeholder: 'Mulai menulis artikel...'
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    }
  });

  // Handle prop updates
  useEffect(() => {
    if (!editor) return;
    const isSame = editor.getHTML() === content;
    if (content !== undefined && !isSame && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);
        const loadingToast = toast.loading('Mengunggah gambar...');
        try {
          const res = await uploadBlogImage(formData);
          const url = getUploadUrl(res.data.imageUrl);
          editor.chain().focus().setImage({ src: url }).run();
          toast.success('Gambar berhasil diunggah!', { id: loadingToast });
        } catch (err) {
          toast.error('Gagal mengunggah gambar.', { id: loadingToast });
        }
      }
    };
    input.click();
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan URL Link:', previousUrl);
    
    if (url === null) {
      return; // Cancelled
    }
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className={styles.editorContainer}>
      {/* Toolbar / Menu Bar */}
      <div className={styles.menuBar}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${styles.menuBtn} ${editor.isActive('bold') ? styles.active : ''}`}
          title="Tebal (Bold)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${styles.menuBtn} ${editor.isActive('italic') ? styles.active : ''}`}
          title="Miring (Italic)"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${styles.menuBtn} ${editor.isActive('underline') ? styles.active : ''}`}
          title="Garis Bawah (Underline)"
        >
          <UnderlineIcon size={16} />
        </button>

        <span className={styles.separator} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${styles.menuBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
          title="Judul 2 (H2)"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${styles.menuBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
          title="Judul 3 (H3)"
        >
          <Heading3 size={16} />
        </button>

        <span className={styles.separator} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${styles.menuBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
          title="Daftar Simbol (Bullet List)"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${styles.menuBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
          title="Daftar Angka (Ordered List)"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${styles.menuBtn} ${editor.isActive('blockquote') ? styles.active : ''}`}
          title="Kutipan (Blockquote)"
        >
          <Quote size={16} />
        </button>

        <span className={styles.separator} />

        <button
          type="button"
          onClick={addLink}
          className={`${styles.menuBtn} ${editor.isActive('link') ? styles.active : ''}`}
          title="Tambah Link"
        >
          <Link2 size={16} />
        </button>
        <button
          type="button"
          onClick={addImage}
          className={styles.menuBtn}
          title="Unggah Gambar"
        >
          <ImageIcon size={16} />
        </button>

        <span className={styles.separator} />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={styles.menuBtn}
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={styles.menuBtn}
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className={styles.editorBody}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
