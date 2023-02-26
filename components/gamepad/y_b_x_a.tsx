import styled from "styled-components";

const Container = styled.div`
    width:  ${props => props.size ?? '20'}px;
    height: ${props => props.size ?? '20'}px;
    /* background: red; */
    position: relative;
`;
const DefaultButton = styled.button`
    /* depened on Container */
    width: inherit;
    height: inherit;
    :active {
        background-color: rgba(0, 0, 0, 0.05);
    }
    border: 1px solid;
    border-radius: 50%;
    position: absolute;
    color: black;
    background-color: transparent;
`;

const ButtonY = styled(DefaultButton)`
    top: 0;
    right: 50%;

    transform: translate(50%, -100%);
`;
const ButtonB = styled(DefaultButton)`
    bottom: 0;
    right: 50%;

    transform: translate(50%, 100%);
`;
const ButtonX = styled(DefaultButton)`
    right: 0;
    top: 50%;
    transform: translate(100%, -50%);
`;
const ButtonA = styled(DefaultButton)`
    top: 50%;
    left: 0%;
    transform: translate(-100%, -50%);
`;
interface Props {
    onTouch: (e: React.TouchEvent, type: 'up' | 'down', index: number) => void;
    size?: number;
}




export function YBXA(props: Props) {
    const {
        onTouch,
        size,
    } = props;
    return (
        <Container size={size}>
            <ButtonY
                onTouchStart={(e: React.TouchEvent) => onTouch(e,'down',3) }
                onTouchEnd={(e: React.TouchEvent) => onTouch(e,'up',3) }
            >
                Y
            </ButtonY>
            <ButtonB
                onTouchStart={(e: React.TouchEvent) => onTouch(e,'down',1) }
                onTouchEnd={(e: React.TouchEvent) => onTouch(e,'up',1) }
            >
                B
            </ButtonB>
            <ButtonX
                onTouchStart={(e: React.TouchEvent) => onTouch(e,'down',2) }
                onTouchEnd={(e: React.TouchEvent) => onTouch(e,'up',2) }
            >
                X
            </ButtonX>
            <ButtonA
                onTouchStart={(e: React.TouchEvent) => onTouch(e,'down',0) }
                onTouchEnd={(e: React.TouchEvent) => onTouch(e,'up',0) }
            >
                A
            </ButtonA>
        </Container>
    );
}

export function LR(props: Props) {
    const {
        onTouch,
        size,
    } = props;
    return (
        <Container size={size}>
            <ButtonX
                onTouchStart={(e: React.TouchEvent) => onTouch(e,'down',2) }
                onTouchEnd={(e: React.TouchEvent) => onTouch(e,'up',2) }
            >
                Right 
            </ButtonX>
            <ButtonA
                onTouchStart={(e: React.TouchEvent) => onTouch(e,'down',0) }
                onTouchEnd={(e: React.TouchEvent) => onTouch(e,'up',0) }
            >
                Left
            </ButtonA>
        </Container>
    );
}
