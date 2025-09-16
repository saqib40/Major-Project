// frontend/src/components/Output.tsx
import styled from "@emotion/styled";

const INSTANCE_URI = "http://localhost:3000";

const OutputContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
`;

const OutputHeader = styled.div`
    background-color: var(--panel-background);
    color: var(--text-color);
    padding: 8px 12px;
    font-weight: 500;
    border-bottom: 1px solid var(--border-color);
    border-top: 1px solid var(--border-color);
`;

const IFrameContainer = styled.div`
    flex-grow: 1;
    background: white;
`;

export const Output = () => {
    return (
        <OutputContainer>
            <OutputHeader>Output</OutputHeader>
            <IFrameContainer>
                <iframe
                    width={"100%"}
                    height={"100%"}
                    src={`${INSTANCE_URI}`}
                    frameBorder="0"
                />
            </IFrameContainer>
        </OutputContainer>
    )
}