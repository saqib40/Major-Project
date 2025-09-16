import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { FaNodeJs, FaPython } from 'react-icons/fa';

/** Constants */
const SLUG_WORDS = ["car", "dog", "computer", "person", "inside", "word", "for", "please", "to", "cool", "open", "source"];
const SERVICE_URL = "http://localhost:3001";

/** Styled components */
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--background-color);
`;

const Card = styled.div`
  background-color: var(--panel-background);
  padding: 40px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 350px;
`;

const Title = styled.h1`
  color: var(--text-color);
  font-size: 2.5em;
  margin-bottom: 20px;
`;

const StyledInput = styled.input`
  width: 100%;
  margin: 10px 0;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: var(--font-family);
  font-size: 1em;
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const LanguageSelector = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
  width: 100%;
`;

const LanguageOption = styled.div<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  margin: 0 10px;
  border: 2px solid ${props => props.selected ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: ${props => props.selected ? 'rgba(88, 166, 255, 0.1)' : 'transparent'};


  &:hover {
    border-color: var(--primary-color);
  }

  svg {
    font-size: 3em;
    margin-bottom: 10px;
  }
`;

const StyledButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background-color: var(--primary-color);
  color: var(--button-text-color);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: 1.1em;
  font-weight: bold;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #4091e3;
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

/** Helper function */
function getRandomSlug() {
    let slug = "";
    for (let i = 0; i < 3; i++) {
        slug += SLUG_WORDS[Math.floor(Math.random() * SLUG_WORDS.length)];
    }
    return slug;
}

/** Component */
export const Landing = () => {
    const [language, setLanguage] = useState("node-js");
    const [replId, setReplId] = useState(getRandomSlug());
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    return (
      <Container>
        <Card>
          <Title>Lepl lit</Title>
          <StyledInput
            onChange={(e) => setReplId(e.target.value)}
            type="text"
            placeholder="Repl ID"
            value={replId}
          />
          <LanguageSelector>
            <LanguageOption selected={language === "node-js"} onClick={() => setLanguage("node-js")}>
              <FaNodeJs color="#68a063" />
              <span>Node.js</span>
            </LanguageOption>
            <LanguageOption selected={language === "python"} onClick={() => setLanguage("python")}>
              <FaPython color="#3776ab" />
              <span>Python</span>
            </LanguageOption>
          </LanguageSelector>

          <StyledButton disabled={loading} onClick={async () => {
            setLoading(true);
            await axios.post(`${SERVICE_URL}/project`, { replId, language });
            setLoading(false);
            navigate(`/coding/?replId=${replId}`)
          }}>{loading ? "Starting ..." : "Start Coding"}</StyledButton>
        </Card>
      </Container>
    );
}