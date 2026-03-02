import tls from "tls";
import { TargetInfo } from "./normalize-target";

export type CertificateFetchOptions = {
  timeoutMs: number;
};

export type CertificateFetchResult = {
  cert: tls.DetailedPeerCertificate | tls.PeerCertificate;
  issuer?: tls.DetailedPeerCertificate | tls.PeerCertificate;
  cipher: tls.CipherNameAndProtocol | null;
  protocol: string | null;
  authorized: boolean;
  authError: string | null;
};

export const fetchCertificate = (
  target: TargetInfo,
  options: CertificateFetchOptions
) =>
  new Promise<CertificateFetchResult>((resolve, reject) => {
    const socket = tls.connect(
      {
        host: target.host,
        port: target.port,
        servername: target.servername,
        rejectUnauthorized: false
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        const issuer = (cert as tls.DetailedPeerCertificate).issuerCertificate;
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();
        socket.end();
        resolve({
          cert,
          issuer,
          cipher,
          protocol,
          authorized: socket.authorized,
          authError: socket.authorizationError
            ? String(socket.authorizationError)
            : null
        });
      }
    );

    socket.setTimeout(options.timeoutMs, () => {
      socket.destroy(new Error("TLS connection timed out"));
    });

    socket.on("error", (error) => {
      reject(error);
    });
  });
