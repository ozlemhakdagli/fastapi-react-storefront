<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Bize_yazin extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		$this->load->library("session");
		$this->load->model('Database_Model');
		$this->load->database();
		$this->load->helper('url');
		
	} 
	public function index()
	{
		
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$data["menu"]="iletisim";
        $data["sayfa"]="iletisim";
		$query=$this->db->get("kategoriler");
		$data["kategoriler"]=$query->result();
		$query=$this->db->get("turu");
		$data["turu"]=$query->result();
		$this->load->view('_header',$data);
		$this->load->view('_leftslide');
		$this->load->view('bize_yazin');
		$this->load->view('_footer');
		
		
	}
	public function mesaj_ekle()
	{
		
		$data=array(
			'adsoy'=> $this->input->post('adsoy'),
			'tel'=> $this->input->post('tel'),
			'email'=> $this->input->post('email'),
			'konu'=> $this->input->post('konu'),
			'mesaj'=> $this->input->post('mesaj'),
			'Ip' => $_SERVER['REMOTE_ADDR']
			);
			$this->Database_Model->insert_data("mesajlar",$data);
			$this->Database_Model->insert_data("mesajlar_uye",$data);
			$this->session->set_flashdata("sonuc", "Mesajınız başarı ile tarafımıza iletilmiştir.En kısa süre içinde geri dönüş yapılacaktır.");
			$adsoy =$this->input->post('adsoy');
			$email =$this->input->post('email');
			// Email Ayarlarını veritabanından çağırma
			
			$query=$this->db->get("ayarlar");
			$data["veri"]=$query->result();
			$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
			// Email Server Ayarlarını
			
			
			
			
			$config = Array(
			'protocol' => 'mail',
			'smtp_host' => ["veri"][0]->smtpserver,
			'smtp_port' => ["veri"][0]->smtpport,
			'smtp_user' => ["veri"][0]->smtpemail,
			'smtp_pass' => ["veri"][0]->smtpsifre,
			'mailtype'=> 'html',
			'charset' => 'utf-8',
			'wordwrap' => TRUE					
			);
			//istediğiniz şekilde mail içeriğini html olarak oluşturulabilir
			$mesaj="Değerli : ".$adsoy."<br>Göndermiş olduğunuz mesaj alınmıştır.En kısa zamanda sizinle iletişime geçeceğiz.<br>Teşekkür ederiz.<br>";
			$mesaj.="====================================================================================<br>";
			$mesaj.=$data["veri"][0]->name."<br>";
			$mesaj.=$data["veri"][0]->adres."<br>";
			$mesaj.=$data["veri"][0]->sehir."<br>";
			$mesaj.=$data["veri"][0]->tel."<br>";
			$mesaj.=$data["veri"][0]->fax."<br>";
			$mesaj.=$data["veri"][0]->email."<br>";
			$mesaj.="Gönderdiğiniz mesaj aşağıdaki gibidir:<br>====================================================================================<br>";
			$mesaj.=$this->input->post('mesaj');
			
			// Email gönderme
			$this->load->library('email',$config);
			
			$this->email->set_newline("\r\n");
			$this->email->from(["veri"][0]->smtpemail); // change it to yours
			$this->email->to($email);
			$this->email->subject('Mesajınız alındı');
			$this->email->message($mesaj);
			//Send
			if($this->email->send())
				$this->session->set_flashdata("email_sent", "Emailiniz başarı ile gönderilmiştir.");
			else
			{
				$this->session->set_flashdata("email_sent", "Email göndermede bir hata oluştu.");
				show_error($this->email->print_debugger()); //  ayrıntılı hata gönderme
			}
			
			
			
			
			
			
		redirect(base_url()."bize_yazin");
	} 
	
	
	
	

}

