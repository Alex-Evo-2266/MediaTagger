import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  ButtonPropsColorOverrides
} from '@mui/material'
import { OverridableStringUnion } from '@mui/types'
import { useState } from 'react'

interface IConfirmDialog {
  onConfirm: () => void
  text: string
  textButton: string
  color: OverridableStringUnion<
    'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
    ButtonPropsColorOverrides
  >
}

export const ConfirmDialog: React.FC<IConfirmDialog> = ({ onConfirm, text, textButton, color }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button color={color} onClick={() => setOpen(true)}>
        {textButton}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <DialogContentText>{text}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button
            color={color}
            variant="contained"
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
