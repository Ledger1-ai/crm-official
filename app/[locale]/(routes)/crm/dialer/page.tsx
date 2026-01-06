import Container from "../../components/ui/Container";
import DialerPanel from './DialerPanel';

export default function DialerPage() {
  return (
    <Container
      title="Dialer"
      description="Dialer uses Amazon Connect CCP (Streams SDK) for outbound calls. BasaltCRM controls dialing and sequencing."
    >
      <DialerPanel />
    </Container>
  );
}
