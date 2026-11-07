"use client"

import { Button } from "@workspace/ui/components/button";
import { ArrowDownIcon, DownloadIcon, FileIcon, FolderIcon, FolderInputIcon, HomeIcon, MoreVerticalIcon, PlusIcon, ServerIcon, SlashIcon, Trash2Icon, UploadIcon } from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@workspace/ui/components/table"
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@workspace/ui/components/breadcrumb";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from "@workspace/ui/components/dropdown-menu"

export default function FileBrowserPage() {
    const [path, setPath] = useState(["."])
    const dir = trpc.filesRouter.ls.useQuery({path: path.join("/")})
    const trpcUtils = trpc.useUtils()
    const deleteFile = trpc.filesRouter.rm.useMutation({
        onSuccess: () => dir.refetch()
    })

    const downloadFile = async (filePath: string) => {
        const result = await trpcUtils.filesRouter.download.fetch({path: filePath})
        const binary = atob(result.data)
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
        const url = URL.createObjectURL(new Blob([bytes]))
        const link = document.createElement("a")
        link.href = url
        link.download = result.fileName
        link.click()
        URL.revokeObjectURL(url)
    }
    return <div className="flex flex-col w-full h-full">
        <div className="flex flex-row p-6 border-b-1 items-center gap-2">
            <h1 className="text-2xl">Files</h1>
            <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant={"ghost"} size="icon-sm"><ArrowDownIcon /></Button>} />
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setPath(["/", "home"])}>
                        <HomeIcon />Home
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPath(["/"])}>
                        <SlashIcon />root
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPath(["."])}>
                        <ServerIcon />Server
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className={"border-b-1 flex flex-row h-[40px] items-center px-1"}>
            <Button variant="ghost">
                <PlusIcon /> Create
            </Button>
        </div>
        <div className="flex flex-col p-4 gap-4">
            <Breadcrumb>
                <BreadcrumbList>
                    {path.map((item, index) => <>
                        <BreadcrumbItem>
                            <BreadcrumbLink>
                                {item}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {index !== path.length - 1 && <BreadcrumbSeparator />}
                    </>)}
                </BreadcrumbList>
            </Breadcrumb>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-5">
                            
                        </TableHead>
                        <TableHead>
                            Name
                        </TableHead>
                        <TableHead>
                            Size
                        </TableHead>
                        <TableHead>
                            Modified
                        </TableHead>
                        <TableHead className="w-5">
                            
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {path.length != 1 && <TableRow onClick={() => {
                        const newPath = path
                        newPath.pop()
                        setPath(newPath)
                    }}>
                        <TableCell>
                            
                        </TableCell>
                        <TableCell>
                            (Up a directory)
                        </TableCell>
                        <TableCell>
                            
                        </TableCell>
                        <TableCell>
                            
                        </TableCell>
                        <TableCell>
                            
                        </TableCell>
                    </TableRow>}
                    {dir.data && dir.data.map(item => <TableRow key={item.file} onClick={() => {
                        if (item.isFolder) {
                            setPath([...path, item.file])
                            console.log([...path, item.file].join("/"))
                        }
                    }}>
                        <TableCell>
                            {item.isFolder ? <FolderIcon size={16} /> : <FileIcon size={16} />}
                        </TableCell>
                        <TableCell>
                            {item.file}
                        </TableCell>
                        <TableCell>
                            {item.stats.size}
                        </TableCell>
                        <TableCell>
                            {new Date(item.stats.mtimeMs).toLocaleString()}
                        </TableCell>
                        <TableCell className="p-0" onClick={ev => {
                            ev.stopPropagation()
                        }}>
                            <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant={"ghost"} size="icon-sm"><MoreVerticalIcon /></Button>} />
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <FolderInputIcon /> Move
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <UploadIcon /> Replace
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={item.isFolder} onClick={() => downloadFile(path.join("/") + "/" + item.file)}>
                                        <DownloadIcon /> Download
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onClick={() => {
                                        if (confirm("Are you sure you want to delete this file")) {
                                            console.log("test")
                                            deleteFile.mutate({path: path.join("/") + "/" + item.file})
                                        }
                                    }}>
                                        <Trash2Icon /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </div>
    </div>
}
