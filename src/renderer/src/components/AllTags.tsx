import { Box, Chip } from "@mui/material"
import { MenuContext } from "@renderer/context"
import { colors } from "@renderer/tagColor"
import { getValueIfStarts } from "@renderer/utils"
import { useContext, useEffect, useState } from "react"


export const AllTagsPage = () => {

    const [tags, setTags] = useState<string[]>([])
    const {onChangeMenu} = useContext(MenuContext)

    const load = async () => {
        setTags(await window.api.getAllTags())
    }

    const clickHandler = (name:string) => {
        onChangeMenu("withGroup", [name])
    }

    useEffect(()=>{
        load()
    },[load])

    return(
        <Box p={2} display="flex" gap="10px" flexWrap="wrap" height="100vh" sx={{overflowY: "scroll"}} >
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                sx={{color: getValueIfStarts(colors, tag) as string, borderColor: getValueIfStarts(colors, tag) as string}}
                onClick={() => clickHandler(tag)}
                color="primary"
                variant="outlined"
              />
            ))}
        </Box>
    )
}