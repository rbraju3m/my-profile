import { Input } from '@mantine/core';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

/**
 * Rich text for bios and case-study text. Only paragraphs, bold, italic,
 * lists, inline code and links; the server sanitises to the same set.
 */
export function RichTextInput({ label, description, value, onChange, error }: { label: string; description?: string; value: string; onChange: (html: string) => void; error?: string }) {
    const editor = useEditor({
        extensions: [StarterKit.configure({ heading: false, blockquote: false, codeBlock: false, horizontalRule: false, link: false }), Link.configure({ openOnClick: false })],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
    });

    return (
        <Input.Wrapper label={label} description={description} error={error}>
            <RichTextEditor editor={editor} mt={4}>
                <RichTextEditor.Toolbar>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Bold />
                        <RichTextEditor.Italic />
                        <RichTextEditor.Code />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.BulletList />
                        <RichTextEditor.OrderedList />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Link />
                        <RichTextEditor.Unlink />
                    </RichTextEditor.ControlsGroup>
                </RichTextEditor.Toolbar>
                <RichTextEditor.Content mih={160} />
            </RichTextEditor>
        </Input.Wrapper>
    );
}
