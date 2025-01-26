'use client'

import * as S from '@effect/schema/Schema'
import React, {
    memo,
    useLayoutEffect,
    useMemo,
    useState,
    useCallback,
    RefObject,
} from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar'
import { Doc as YDoc } from 'yjs'
import { AppSidebar } from '@/components/app-sidebar'
import { Editor, EditorProvider, useEditor } from '@tiptap/react'
import { initialContent } from '@/lib/data/initialContent'
import ExtensionKit from '@/extensions/extension-kit'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { settingQuery } from '@/db/queries'
import { useEvolu, useQueries, useQuery } from '@evolu/react'
import { NonEmptyString50 } from '@/db/schema'
import { Database, evolu } from '@/db/db'
import useNoteStore from '@/store/note'
import useSidebarStore from '@/store/sidebar'
import { ReactSketchCanvasRef } from 'react-sketch-canvas'
import Document from '@/app/app/page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EditorHeader } from '@/components/BlockEditor/components/EditorHeader'
import { Cone } from 'lucide-react'

const queryClient = new QueryClient()

export default function AppLayout({
    children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) {
    const canvasRef = React.useRef<ReactSketchCanvasRef>(null)

    const owner = useEvolu().getOwner()
    const evoluId = owner ? S.decodeSync(S.String)(owner?.id) : null

    const [provider, setProvider] = useState<TiptapCollabProvider | null>(null)
    const [collabToken, setCollabToken] = useState<string | null>(null)
    const searchParams = useSearchParams()

    const hasCollab = parseInt(searchParams.get('noCollab') as string) !== 1

    const room = 0

    const ydoc = useMemo(() => new YDoc(), [])

    useLayoutEffect(() => {
        if (hasCollab && collabToken) {
            setProvider(
                new TiptapCollabProvider({
                    name: `${process.env.NEXT_PUBLIC_COLLAB_DOC_PREFIX}${room}`,
                    appId: process.env.NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID ?? '',
                    token: collabToken,
                    document: ydoc,
                })
            )
        }
    }, [setProvider, collabToken, ydoc, room, hasCollab])

    // Editor related
    // Evolu
    const { update } = useEvolu<Database>()

    // Zustand Stores
    const { item, exportedId, noteId } = useNoteStore((state) => ({
        item: state.item,
        exportedId: state.id,
        noteId: state.noteId,
    }))

    /**
     * Exports and saves note data into the exportedData table
     */
    const saveData = React.useCallback(
        /**
         * Saves the current editor content into the exportedData table
         * @param editor The Tiptap editor instance
         */
        (editor: Editor) => {
            if (item === null || !editor || exportedId === null) return

            const content = editor.getJSON()
            console.log('content', content)

            update('exportedData', {
                id: exportedId,
                jsonData: content,
            })
        },
        [item, update, exportedId]
    )

    const debouncedSave = useDebouncedCallback(saveData, 2000)

    // const saveInkData = React.useCallback(
    //     async (canvasRef: ReactSketchCanvasRef) => {
    //         if (item === null) return
    //         const data = exportedData.rows.find(
    //             (row) => row.noteId === item.id
    //         )

    //         if (
    //             data === undefined ||
    //             data === null ||
    //             canvasRef === null
    //         )
    //             return

    //         const time = await canvasRef?.getSketchingTime()
    //         const paths = await canvasRef?.exportPaths()

    //         const cleanedData = convertCanvasPathsForDatabase(paths)

    //         update('exportedData', {
    //             id: data.id,
    //             inkData: S.decodeSync(CanvasPathArray)(cleanedData),
    //         })
    //     },
    //     [item, exportedData.rows, update]
    // )
    // const debouncedInkSave = useDebouncedCallback(saveInkData, 1000)

    // Memoize editorProps to prevent unnecessary re-renders
    const editorProps = useMemo(
        () => ({
            attributes: {
                autocomplete: 'off',
                autocorrect: 'off',
                autocapitalize: 'off',
                class: 'min-h-full',
            },
        }),
        []
    )

    // Memoize extensions to ensure they are stable across renders
    const extensions = useMemo(
        () => [
            ...ExtensionKit({
                provider,
            }),
        ],
        [provider]
    )

    // Memoize the delete handler till extension is released
    const [content, setContent] = useState<any>(null)
    const [previousImages, setPreviousImages] = useState<string[]>([])
    const [imagesList, setImagesList] = useState<string[]>([])

    // const handleImageDelete = useCallback(
    //     async (props: { editor: Editor }) => {
    //         console.log('❌ Deleting')
    //         const editor = props.editor
    //         setContent(editor.getJSON())
    //         console.log(editor.getJSON())
    //         const currentImages: { src: string; fileId: string }[] = []
    //         editor.getJSON().content?.forEach((item) => {
    //             if (
    //                 item.type === 'image' &&
    //                 item.attrs?.src &&
    //                 item.attrs?.fileId
    //             ) {
    //                 currentImages.push({
    //                     src: item.attrs.src,
    //                     fileId: item.attrs.fileId,
    //                 })
    //             }
    //         })
    //         const deletedImages = previousImages.filter(
    //             (url: string) =>
    //                 !currentImages.map((img) => img.src).includes(url)
    //         )
    //         for (const url of deletedImages) {
    //             console.log('Deleting image from blob storage:', url)
    //             const fileId = currentImages.find(
    //                 (img) => img.src === url
    //             )?.fileId
    //             await fetch(`/api/r2/upload?fileId=${fileId}&docId=${noteId}`, {
    //                 method: 'DELETE',
    //             })
    //         }

    //         setPreviousImages(currentImages.map((img) => img.src))
    //         setImagesList(currentImages.map((img) => img.src))
    //         console.log(currentImages)
    //     },
    //     [previousImages, noteId]
    // )

    // Memoize the onUpdate handler
    const handleUpdate = useCallback(
        (props) => {
            debouncedSave(props.editor)
            console.log('Updating...')
        },
        [debouncedSave]
    )

    const [readOnly, setReadOnly] = useState(false)

    return (
        <TooltipProvider>
            <SidebarProvider>
                <QueryClientProvider client={queryClient}>
                    <AppSidebar canvasRef={canvasRef} id={evoluId!} />
                </QueryClientProvider>
                <SidebarInset>
                    <EditorProvider
                        autofocus={false}
                        immediatelyRender={true}
                        // content={initialContent}
                        shouldRerenderOnTransaction={false}
                        extensions={extensions}
                        editorProps={editorProps}
                        onUpdate={(props) => {
                            handleUpdate(props)
                            // await handleImageDelete(props)
                        }}
                        onTransaction={(editor) => {
                            console.log('Transacting')
                            // const { from, to } = editor.state.selection
                            // console.log('From and to:', from, to)
                        }}
                        slotBefore={
                            <MemoizedEditorHeader
                                canvasRef={canvasRef}
                                readOnly={readOnly}
                                setReadOnly={setReadOnly}
                            />
                        }
                        content={`
                            <h1></h1>
                            <p></p>
                        `}
                    >
                        {React.isValidElement(children)
                            ? React.cloneElement(children, {
                                  ref: canvasRef,
                              })
                            : children}
                    </EditorProvider>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}

const MemoizedEditorHeader = React.memo(
    ({
        canvasRef,
        readOnly,
        setReadOnly,
    }: {
        canvasRef: RefObject<ReactSketchCanvasRef> | null
        readOnly: boolean
        setReadOnly: (value: boolean) => void
    }) => {
        return (
            <EditorHeader
                canvasRef={canvasRef}
                readOnly={readOnly}
                setReadOnly={setReadOnly}
            />
        )
    }
)

MemoizedEditorHeader.displayName = 'MemoizedEditorHeader'
