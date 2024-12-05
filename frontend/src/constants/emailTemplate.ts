import variables from '../../public/files/variables.json'

export const defaultTemplate = `
    <div>
        <h2 >Xin chào anh/chị,</h2>
        <p>
           Tiến Phước kính mời anh chị tham gia khảo sát phản hồi cho nhân sự: <strong style="color: #2d4432">[USER_FULLNAME]</strong>.
        </p>
        <p>
            Anh chị vui lòng nhấp vào liên kết bên dưới để thực hiện khảo sát:
        </p>
        <p>
            <a href="[LINK]" target="_blank" style="background-color:red">[LINK]</a>
        </p>
        <p>
            Trân trọng cảm ơn!
        </p>
    </div>
`

export const EmailParamsArr = Object.values(variables)
