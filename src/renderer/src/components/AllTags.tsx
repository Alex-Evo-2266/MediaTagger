import { Box, Chip, TextField } from "@mui/material"
import { MenuContext } from "@renderer/context"
import { colors } from "@renderer/tagColor"
import { customSort, getValueIfStarts } from "@renderer/utils"
import { useContext, useEffect, useState } from "react"


export const AllTagsPage = () => {

    const [tags, setTags] = useState<string[]>([])
    const [search, setSearch] = useState("")
    const {onChangeMenu} = useContext(MenuContext)

    const load = async () => {
        setTags(customSort(await window.api.getAllTags(), colors))
    }

    const clickHandler = (name:string) => {
        onChangeMenu("withGroup", [name])
    }

    const filteredTags = tags.filter((tag) => tag.toLowerCase().includes(search.trim().toLowerCase()))

    useEffect(()=>{
        load()
    },[load])

    return(
        <Box p={2} display="flex" flexDirection="column" gap={2} height="100vh" sx={{overflowY: "scroll"}} >
            <TextField
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tags"
                variant="outlined"
                sx={{ maxWidth: 320 }}
            />
            <Box display="flex" gap="10px" flexWrap="wrap" >
                {filteredTags.map((tag) => (
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
        </Box>
    )
}