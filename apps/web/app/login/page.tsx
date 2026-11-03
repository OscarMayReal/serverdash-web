import { Button } from "@workspace/ui/components/button"
import {Input} from "@workspace/ui/components/input"
import {KeyIcon} from "lucide-react"

export default function LoginPage() {
    return <div className={"flex flex-row h-screen w-screen"}>
        <div className="w-2/8 h-full bg-primary flex flex-col items-center justify-center">
            <h1 className="text-primary-foreground text-4xl font-light">ServerDash</h1>
        </div>
        <div className="w-6/8 h-full flex flex-col items-center justify-center">
            <div className="flex flex-col w-[350px] gap-3">
                <div className="mb-2 text-3xl text-primary">
                    Log In
                </div>
                <Input placeholder="Username" />
                <Input placeholder="Password" type="password" />
                <Button><KeyIcon /> Log In</Button>
            </div>
        </div>
    </div>
}