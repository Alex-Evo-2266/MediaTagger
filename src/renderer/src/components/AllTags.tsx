import { Box, Chip } from "@mui/material"
import { MenuContext } from "@renderer/context"
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
        <Box p={2} display="flex" gap="10px" flexWrap="wrap" height="100vh">
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => clickHandler(tag)}
                color="primary"
                variant="outlined"
              />
            ))}
        </Box>
    )
}